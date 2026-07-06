from __future__ import annotations

import argparse
import csv
import difflib
import json
import sys
from dataclasses import dataclass, replace
from datetime import datetime
from pathlib import Path

from .models import Release
from .net import Http
from .release_dates import (
    ReleaseDateCandidate,
    bandcamp_release_date_candidates,
    discogs_date_candidates,
    musicbrainz_date_candidates,
    parse_source_date,
)
from .text import clean_text, loose, normalize_release


REPO_ROOT = Path(__file__).resolve().parents[4]
OVERRIDE_APPLY_BASES = {"original_release", "format_release", "reissue"}


@dataclass(frozen=True)
class CatalogItem:
    collection: str
    item_id: str
    path: Path
    artist: str
    title: str
    item_format: str
    existing_release_date: str = ""
    source_urls: tuple[str, ...] = ()
    inventory_id: str = ""
    inventory_release_date: str = ""
    inventory_release_date_raw: str = ""


@dataclass(frozen=True)
class AnalyzedItem:
    item: CatalogItem
    candidates: list[ReleaseDateCandidate]
    chosen: ReleaseDateCandidate | None
    status: str
    conflict: str = ""


@dataclass
class SourceBudget:
    limit: int | None
    used: int = 0

    def take(self) -> bool:
        if self.limit is None:
            return True
        if self.used >= self.limit:
            return False
        self.used += 1
        return True


def run_release_date_research(
    project_root: Path = REPO_ROOT,
    releases_dir: Path | None = None,
    artists_dir: Path | None = None,
    distro_dir: Path | None = None,
    inventory_source: Path | None = None,
    out_dir: Path | None = None,
    source_limit: int | None = 0,
    overrides_path: Path | None = None,
    user_agent_contact: str = "example@example.com",
    apply: bool = False,
) -> dict[str, object]:
    project_root = project_root.resolve()
    releases_dir = (releases_dir or project_root / "apps" / "web" / "src" / "content" / "releases").resolve()
    artists_dir = (artists_dir or project_root / "apps" / "web" / "src" / "content" / "artists").resolve()
    distro_dir = (distro_dir or project_root / "apps" / "web" / "src" / "content" / "distro").resolve()
    inventory_source = (inventory_source or project_root / "scripts" / "data" / "distro-inventory-source.json").resolve()
    report_dir = (
        out_dir.resolve()
        if out_dir
        else project_root / ".codex-artifacts" / "release-date-research" / datetime.now().strftime("%Y%m%d%H%M%S")
    )
    report_dir.mkdir(parents=True, exist_ok=True)

    inventory = read_inventory_source(inventory_source)
    items = read_release_items(releases_dir, artists_dir) + read_distro_items(distro_dir, inventory)
    overrides = load_verified_overrides(overrides_path)
    http = Http(report_dir / ".cache", f"release-date-research/1.0 (contact: {user_agent_contact})")
    budget = SourceBudget(None if source_limit is None or source_limit < 0 else source_limit)

    analyzed = [analyze_item(item, overrides, http, budget, user_agent_contact) for item in items]
    proposed = proposed_updates(analyzed)
    apply_rows = apply_updates(project_root, proposed) if apply else []
    summary = build_summary(items, analyzed, proposed, apply_rows, budget, apply)
    write_reports(report_dir, summary, analyzed, proposed, apply_rows)
    return {"summary": summary, "report_dir": str(report_dir), "items": len(items)}


def read_release_items(releases_dir: Path, artists_dir: Path) -> list[CatalogItem]:
    artists = read_artist_titles(artists_dir)
    items: list[CatalogItem] = []
    if not releases_dir.exists():
        return items
    for path in sorted(releases_dir.glob("*.md")):
        frontmatter = read_frontmatter(path)
        artist_slug = str(frontmatter.get("artist", ""))
        formats = frontmatter.get("formats") or []
        source_urls = tuple(
            url
            for url in (frontmatter.get("merch_url", ""), frontmatter.get("source_url", ""))
            if isinstance(url, str) and url.startswith(("http://", "https://"))
        )
        items.append(
            CatalogItem(
                collection="releases",
                item_id=path.stem,
                path=path.resolve(),
                artist=artists.get(artist_slug, artist_slug),
                title=str(frontmatter.get("title", path.stem)),
                item_format=", ".join(formats) if isinstance(formats, list) else str(formats),
                existing_release_date=str(frontmatter.get("release_date", "")),
                source_urls=source_urls,
            )
        )
    return items


def read_distro_items(distro_dir: Path, inventory: dict) -> list[CatalogItem]:
    items: list[CatalogItem] = []
    if not distro_dir.exists():
        return items
    for path in sorted(distro_dir.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        row = find_inventory_row(inventory, data)
        inventory_release_date_raw = str(row.get("releaseDate") or "") if row else ""
        inventory_release_date, _precision = parse_source_date(inventory_release_date_raw)
        source_urls = tuple(
            url
            for url in (data.get("source_url", ""), data.get("source_page_url", ""))
            if isinstance(url, str) and url.startswith(("http://", "https://"))
        )
        items.append(
            CatalogItem(
                collection="distro",
                item_id=path.stem,
                path=path.resolve(),
                artist=str(data.get("artist_or_label", "")),
                title=str(data.get("title", path.stem)),
                item_format=str(data.get("format") or data.get("group") or ""),
                existing_release_date=str(data.get("release_date", "")),
                source_urls=source_urls,
                inventory_id=str(row.get("id", "")) if row else "",
                inventory_release_date=inventory_release_date,
                inventory_release_date_raw=inventory_release_date_raw,
            )
        )
    return items


def read_artist_titles(artists_dir: Path) -> dict[str, str]:
    if not artists_dir.exists():
        return {}
    return {
        path.stem: str(read_frontmatter(path).get("title", path.stem))
        for path in sorted(artists_dir.glob("*.md"))
    }


def read_frontmatter(path: Path) -> dict[str, object]:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    data: dict[str, object] = {}
    current_key = ""
    for line in lines[1:]:
        if line.strip() == "---":
            break
        if line.startswith("  - ") and current_key:
            values = data.setdefault(current_key, [])
            if isinstance(values, list):
                values.append(strip_scalar(line[4:]))
            continue
        if ":" not in line or line.startswith(" "):
            continue
        key, raw_value = line.split(":", 1)
        key = key.strip()
        value = raw_value.strip()
        current_key = key
        if not value:
            data[key] = []
        elif value in {"|-", ">-", "|", ">"}:
            data[key] = ""
        else:
            data[key] = strip_scalar(value)
    return data


def strip_scalar(value: str) -> str:
    return clean_text(value).strip("\"'")


def read_inventory_source(path: Path) -> dict:
    if not path.exists():
        return {"rows": []}
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, dict) else {"rows": []}


def find_inventory_row(inventory: dict, content: dict) -> dict | None:
    item_type = inventory_item_type(str(content.get("group", "")))
    typed_key = identity_key(str(content.get("artist_or_label", "")), str(content.get("title", "")), item_type)
    for row in inventory.get("rows", []):
        if typed_key in row_identity_keys(row):
            return row
    loose_key = loose_identity_key(str(content.get("artist_or_label", "")), str(content.get("title", "")))
    matches = [row for row in inventory.get("rows", []) if loose_key in row_loose_identity_keys(row)]
    return matches[0] if len(matches) == 1 else None


def inventory_item_type(group: str) -> str:
    if group == "CDs":
        return "CD"
    if group == "Tapes":
        return "Tape"
    return group


def identity_key(artist: str, title: str, item_type: str) -> str:
    return f"{loose(artist)}|{loose(title)}|{item_type}"


def loose_identity_key(artist: str, title: str) -> str:
    return f"{loose(artist)}|{loose(title)}"


def row_identity_keys(row: dict) -> set[str]:
    keys = {identity_key(str(row.get("sourceArtist", "")), str(row.get("sourceTitle", "")), str(row.get("itemType", "")))}
    for alias in row.get("sourceAliases", []):
        if isinstance(alias, dict):
            keys.add(identity_key(str(alias.get("artist", "")), str(alias.get("title", "")), str(alias.get("itemType", ""))))
    return keys


def row_loose_identity_keys(row: dict) -> set[str]:
    keys = {loose_identity_key(str(row.get("sourceArtist", "")), str(row.get("sourceTitle", "")))}
    for alias in row.get("sourceAliases", []):
        if isinstance(alias, dict):
            keys.add(loose_identity_key(str(alias.get("artist", "")), str(alias.get("title", ""))))
    return keys


def analyze_item(
    item: CatalogItem,
    overrides: list[dict[str, object]],
    http: Http,
    budget: SourceBudget,
    user_agent_contact: str,
) -> AnalyzedItem:
    release = release_from_item(item)
    candidates = override_candidates(item, overrides)
    inventory_candidate = candidate_from_inventory(item)
    if inventory_candidate:
        candidates.append(inventory_candidate)
    for url in item.source_urls:
        if budget.take():
            candidates.extend(bandcamp_release_date_candidates(release, http, url))
    if budget.take():
        candidates.extend(musicbrainz_date_candidates(release, http.cache_dir, user_agent_contact))
    if budget.take():
        candidates.extend(discogs_date_candidates(release, http))
    chosen, status, conflict = choose_candidate(candidates)
    return AnalyzedItem(item=item, candidates=candidates, chosen=chosen, status=status, conflict=conflict)


def release_from_item(item: CatalogItem) -> Release:
    return normalize_release(0, item.artist, item.title, normalize_item_format(item.item_format))


def normalize_item_format(value: str) -> str:
    normalized = clean_text(value)
    if normalized in {"Vinyl 12-inch", "Vinyl", "Black Vinyl LP"}:
        return "Vinyl 12in"
    if normalized == "Vinyl 10-inch":
        return "Vinyl 10in"
    if normalized == "Tapes":
        return "Tape"
    if normalized == "CDs":
        return "CD"
    return normalized


def candidate_from_inventory(item: CatalogItem) -> ReleaseDateCandidate | None:
    if not item.inventory_release_date:
        return None
    return ReleaseDateCandidate(
        date=item.inventory_release_date,
        precision="day",
        basis="format_release",
        source_tier="manual",
        source_name="Distro Inventory Source",
        matched_artist=item.artist,
        matched_title=item.title,
        matched_format=item.item_format,
        confidence="medium",
        notes=f"Matched source row {item.inventory_id}",
        score=80,
    )


def load_verified_overrides(path: Path | None) -> list[dict[str, object]]:
    if not path:
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict):
        return [value | {"key": key} for key, value in data.items() if isinstance(value, dict)]
    return []


def override_candidates(item: CatalogItem, overrides: list[dict[str, object]]) -> list[ReleaseDateCandidate]:
    candidates = []
    for override in overrides:
        if not override_matches(item, override):
            continue
        date, precision = parse_source_date(str(override.get("chosen_date") or override.get("date") or ""))
        basis = str(override.get("basis") or "original_release")
        source_url = str(override.get("source_url") or override.get("url") or "")
        note = str(override.get("reviewer_note") or override.get("note") or "")
        if not date or precision != "day":
            raise ValueError(f"Verified override for {item.collection}:{item.item_id} must use a day-precision date.")
        if basis not in OVERRIDE_APPLY_BASES:
            raise ValueError(f"Verified override for {item.collection}:{item.item_id} uses non-applicable basis {basis}.")
        if not source_url or not note:
            raise ValueError(f"Verified override for {item.collection}:{item.item_id} must include source_url and reviewer_note.")
        candidates.append(
            ReleaseDateCandidate(
                date=date,
                precision=precision,
                basis=basis,
                source_tier="manual",
                source_name="Verified Override",
                source_url=source_url,
                matched_artist=str(override.get("artist") or item.artist),
                matched_title=str(override.get("title") or item.title),
                matched_format=str(override.get("format") or item.item_format),
                confidence="high",
                notes=note,
                score=200,
            )
        )
    return candidates


def override_matches(item: CatalogItem, override: dict[str, object]) -> bool:
    if override.get("collection") and str(override.get("collection")) != item.collection:
        return False
    item_id = str(override.get("item_id") or override.get("id") or "")
    if item_id and item_id in {item.item_id, f"{item.collection}:{item.item_id}"}:
        return True
    key = str(override.get("key") or "")
    if key and key in {item.item_id, f"{item.collection}:{item.item_id}"}:
        return True
    artist = str(override.get("artist") or "")
    title = str(override.get("title") or "")
    return bool(artist and title and loose_identity_key(artist, title) == loose_identity_key(item.artist, item.title))


def choose_candidate(candidates: list[ReleaseDateCandidate]) -> tuple[ReleaseDateCandidate | None, str, str]:
    if not candidates:
        return None, "unknown", ""
    verified = next((candidate for candidate in candidates if candidate.source_name == "Verified Override"), None)
    if verified:
        return verified, "verified_override", ""
    credible = [
        candidate
        for candidate in candidates
        if candidate.precision == "day"
        and candidate.basis != "platform_upload"
        and candidate.source_tier in {"official", "catalog_database", "retailer", "manual"}
        and candidate.confidence in {"high", "medium"}
    ]
    conflicting = {(candidate.date, candidate.basis) for candidate in credible}
    if len(conflicting) > 1:
        return best_candidate(candidates), "manual_review", "credible sources disagree on date or basis"
    official = next(
        (
            candidate
            for candidate in credible
            if candidate.source_tier == "official" and candidate.confidence == "high" and candidate.basis in {"original_release", "format_release"}
        ),
        None,
    )
    if official:
        return official, "high_confidence", ""
    same_day_sources: dict[str, set[str]] = {}
    for candidate in credible:
        same_day_sources.setdefault(candidate.date, set()).add(candidate.source_name)
    corroborated_date = next((date for date, sources in same_day_sources.items() if len(sources) > 1), "")
    if corroborated_date:
        candidate = next(candidate for candidate in credible if candidate.date == corroborated_date)
        return replace(candidate, confidence="high"), "high_confidence", ""
    return best_candidate(candidates), "manual_review", ""


def best_candidate(candidates: list[ReleaseDateCandidate]) -> ReleaseDateCandidate:
    tier_score = {"official": 5, "manual": 4, "catalog_database": 3, "retailer": 2, "dsp": 1}
    confidence_score = {"high": 3, "medium": 2, "low": 1}
    basis_score = {"original_release": 4, "format_release": 3, "reissue": 2, "platform_upload": 0}
    return max(
        candidates,
        key=lambda candidate: (
            tier_score.get(candidate.source_tier, 0),
            confidence_score.get(candidate.confidence, 0),
            basis_score.get(candidate.basis, 1),
            candidate.score,
        ),
    )


def proposed_updates(analyzed: list[AnalyzedItem]) -> list[dict[str, str]]:
    rows = []
    for result in analyzed:
        chosen = result.chosen
        if not chosen or not can_apply(result):
            continue
        if result.item.existing_release_date == chosen.date:
            continue
        rows.append(
            {
                "collection": result.item.collection,
                "item_id": result.item.item_id,
                "path": str(result.item.path),
                "old_value": result.item.existing_release_date,
                "new_value": chosen.date,
                "basis": chosen.basis,
                "confidence": chosen.confidence,
                "source_url": chosen.source_url,
                "authority": chosen.source_name,
                "notes": chosen.notes,
            }
        )
    return rows


def can_apply(result: AnalyzedItem) -> bool:
    chosen = result.chosen
    return bool(
        chosen
        and result.status in {"high_confidence", "verified_override"}
        and chosen.precision == "day"
        and chosen.confidence == "high"
        and chosen.basis != "platform_upload"
    )


def apply_updates(project_root: Path, proposed: list[dict[str, str]]) -> list[dict[str, str]]:
    rows = []
    for row in proposed:
        path = Path(row["path"]).resolve()
        if not path.is_relative_to(project_root):
            raise ValueError(f"Refusing to update outside project root: {path}")
        if path.suffix == ".json":
            data = json.loads(path.read_text(encoding="utf-8"))
            data["release_date"] = row["new_value"]
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        else:
            path.write_text(markdown_with_release_date(path.read_text(encoding="utf-8"), row["new_value"]), encoding="utf-8")
        rows.append(row)
    return rows


def markdown_with_release_date(text: str, release_date: str) -> str:
    lines = text.splitlines()
    in_frontmatter = bool(lines and lines[0].strip() == "---")
    insert_at = 1
    for index, line in enumerate(lines[1:], 1):
        if in_frontmatter and line.startswith("release_date:"):
            lines[index] = f"release_date: {release_date}"
            return "\n".join(lines) + "\n"
        if in_frontmatter and line.startswith("artist:"):
            insert_at = index + 1
        if in_frontmatter and line.strip() == "---":
            lines.insert(insert_at, f"release_date: {release_date}")
            return "\n".join(lines) + "\n"
    return text


def build_summary(
    items: list[CatalogItem],
    analyzed: list[AnalyzedItem],
    proposed: list[dict[str, str]],
    applied: list[dict[str, str]],
    budget: SourceBudget,
    apply: bool,
) -> dict[str, object]:
    dated = [item for item in items if item.existing_release_date]
    missing = [item for item in items if not item.existing_release_date]
    conflicts = conflict_rows(analyzed)
    return {
        "mode": "apply" if apply else "dry-run",
        "totalItems": len(items),
        "releaseItems": sum(1 for item in items if item.collection == "releases"),
        "distroItems": sum(1 for item in items if item.collection == "distro"),
        "datedItems": len(dated),
        "missingDateItems": len(missing),
        "candidateRows": sum(len(result.candidates) for result in analyzed),
        "manualReviewItems": sum(1 for result in analyzed if result.status == "manual_review"),
        "conflictRows": len(conflicts),
        "proposedUpdates": len(proposed),
        "appliedUpdates": len(applied),
        "sourceLookupsUsed": budget.used,
        "sourceLookupLimit": budget.limit,
    }


def write_reports(
    report_dir: Path,
    summary: dict[str, object],
    analyzed: list[AnalyzedItem],
    proposed: list[dict[str, str]],
    applied: list[dict[str, str]],
) -> None:
    (report_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_tsv(report_dir / "candidates.tsv", candidate_rows(analyzed), CANDIDATE_COLUMNS)
    write_tsv(report_dir / "missing.tsv", missing_rows(analyzed), MISSING_COLUMNS)
    write_tsv(report_dir / "conflicts.tsv", conflict_rows(analyzed), CONFLICT_COLUMNS)
    write_tsv(report_dir / "proposed-updates.tsv", proposed, PROPOSED_COLUMNS)
    write_tsv(report_dir / "apply-evidence.tsv", applied, PROPOSED_COLUMNS)
    (report_dir / "proposed-content-updates.patch").write_text(proposed_patch(proposed), encoding="utf-8")


CANDIDATE_COLUMNS = [
    "collection",
    "item_id",
    "path",
    "existing_release_date",
    "date",
    "precision",
    "basis",
    "source_tier",
    "source_name",
    "source_url",
    "matched_artist",
    "matched_title",
    "matched_format",
    "confidence",
    "notes",
]
MISSING_COLUMNS = ["collection", "item_id", "path", "artist", "title", "format", "status"]
CONFLICT_COLUMNS = ["collection", "item_id", "path", "reason", "existing_release_date", "source_release_date", "working_target", "notes"]
PROPOSED_COLUMNS = ["collection", "item_id", "path", "old_value", "new_value", "basis", "confidence", "source_url", "authority", "notes"]


def candidate_rows(analyzed: list[AnalyzedItem]) -> list[dict[str, str]]:
    rows = []
    for result in analyzed:
        for candidate in result.candidates:
            rows.append(
                {
                    "collection": result.item.collection,
                    "item_id": result.item.item_id,
                    "path": str(result.item.path),
                    "existing_release_date": result.item.existing_release_date,
                    "date": candidate.date,
                    "precision": candidate.precision,
                    "basis": candidate.basis,
                    "source_tier": candidate.source_tier,
                    "source_name": candidate.source_name,
                    "source_url": candidate.source_url,
                    "matched_artist": candidate.matched_artist,
                    "matched_title": candidate.matched_title,
                    "matched_format": candidate.matched_format,
                    "confidence": candidate.confidence,
                    "notes": candidate.notes,
                }
            )
    return rows


def missing_rows(analyzed: list[AnalyzedItem]) -> list[dict[str, str]]:
    return [
        {
            "collection": result.item.collection,
            "item_id": result.item.item_id,
            "path": str(result.item.path),
            "artist": result.item.artist,
            "title": result.item.title,
            "format": result.item.item_format,
            "status": result.status,
        }
        for result in analyzed
        if not result.item.existing_release_date
    ]


def conflict_rows(analyzed: list[AnalyzedItem]) -> list[dict[str, str]]:
    rows = []
    for result in analyzed:
        item = result.item
        if item.inventory_release_date and item.existing_release_date and item.inventory_release_date != item.existing_release_date:
            rows.append(
                {
                    "collection": item.collection,
                    "item_id": item.item_id,
                    "path": str(item.path),
                    "reason": "content_inventory_disagreement",
                    "existing_release_date": item.existing_release_date,
                    "source_release_date": item.inventory_release_date,
                    "working_target": "source",
                    "notes": f"Distro Inventory Source row {item.inventory_id}",
                }
            )
        if item.existing_release_date and not item.inventory_release_date and item.inventory_id and not item.inventory_release_date_raw:
            rows.append(
                {
                    "collection": item.collection,
                    "item_id": item.item_id,
                    "path": str(item.path),
                    "reason": "inventory_missing_content_has_date",
                    "existing_release_date": item.existing_release_date,
                    "source_release_date": "",
                    "working_target": "content",
                    "notes": f"Distro Inventory Source row {item.inventory_id} has no date",
                }
            )
        if result.conflict:
            detail = conflict_candidate_detail(result)
            rows.append(
                {
                    "collection": item.collection,
                    "item_id": item.item_id,
                    "path": str(item.path),
                    "reason": "candidate_conflict",
                    "existing_release_date": item.existing_release_date,
                    "source_release_date": detail,
                    "working_target": "manual_review",
                    "notes": f"{result.conflict}: {detail}",
                }
            )
    return rows


def conflict_candidate_detail(result: AnalyzedItem) -> str:
    return "; ".join(
        f"{candidate.date} {candidate.basis} {candidate.source_tier}/{candidate.source_name}"
        for candidate in result.candidates
        if candidate.precision and candidate.date
    )


def write_tsv(path: Path, rows: list[dict[str, str]], columns: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def proposed_patch(proposed: list[dict[str, str]]) -> str:
    chunks = []
    for row in proposed:
        path = Path(row["path"])
        before = path.read_text(encoding="utf-8").splitlines(keepends=True)
        if path.suffix == ".json":
            data = json.loads(path.read_text(encoding="utf-8"))
            data["release_date"] = row["new_value"]
            after = (json.dumps(data, ensure_ascii=False, indent=2) + "\n").splitlines(keepends=True)
        else:
            after = markdown_with_release_date(path.read_text(encoding="utf-8"), row["new_value"]).splitlines(keepends=True)
        chunks.extend(difflib.unified_diff(before, after, fromfile=str(path), tofile=str(path), lineterm=""))
    return "\n".join(chunks) + ("\n" if chunks else "")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Research release dates for current release and distro content.")
    parser.add_argument("--project-root", type=Path, default=REPO_ROOT, help="Repository root.")
    parser.add_argument("--out-dir", type=Path, default=None, help="Report output directory.")
    parser.add_argument("--source-limit", type=int, default=0, help="Network-backed source lookups. Use -1 for no limit.")
    parser.add_argument("--overrides", type=Path, default=None, help="Verified overrides JSON.")
    parser.add_argument("--apply", action="store_true", help="Apply safe high-confidence dates and verified overrides.")
    parser.add_argument("--user-agent-contact", default="example@example.com", help="Contact string for API User-Agent.")
    return parser


def main(argv: list[str] | None = None) -> int:
    configure_console()
    args = build_parser().parse_args(argv)
    try:
        result = run_release_date_research(
            project_root=args.project_root,
            out_dir=args.out_dir,
            source_limit=args.source_limit,
            overrides_path=args.overrides,
            user_agent_contact=args.user_agent_contact,
            apply=args.apply,
        )
    except Exception as error:  # noqa: BLE001
        print(f"ERROR {error}", file=sys.stderr)
        return 1
    summary = result["summary"]
    print(
        f"{summary['mode']}: {summary['totalItems']} items, {summary['datedItems']} dated, "
        f"{summary['missingDateItems']} missing, {summary['conflictRows']} conflicts, "
        f"{summary['proposedUpdates']} proposed, {summary['appliedUpdates']} applied"
    )
    print(f"reports: {result['report_dir']}")
    return 0


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


if __name__ == "__main__":
    raise SystemExit(main())
