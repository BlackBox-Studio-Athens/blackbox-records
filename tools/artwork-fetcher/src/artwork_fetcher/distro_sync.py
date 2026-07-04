from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import sys
import unicodedata
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from .text import GREEK_TO_LATIN, clean_text, loose, names_match
from .models import Release
from .net import Http, cache_key, read_json, write_json
from .sources import is_bandcamp_url, meta_content
from .text import score_confidence


REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_CONTENT_DIR = REPO_ROOT / "apps" / "web" / "src" / "content" / "distro"
DISTRO_SCHEMA = "../../../.astro/collections/distro.schema.json"
DISTRO_GROUPS = {"Vinyl 12-inch", "Vinyl 10-inch", "Vinyl 7-inch", "CDs", "Clothes", "Tapes", "Other"}
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
CASSETTE_MOCKUP_DISCLOSURE = "Cassette case artwork mockup. Actual cassette shell and labels may vary."


@dataclass(frozen=True)
class FormatConfig:
    group: str
    format_label: str
    mockup_dirs: tuple[str, ...]
    mockup_suffix: str


SUPPORTED_FORMATS = {
    "CD": FormatConfig("CDs", "CD", ("cd-front-concrete",), "cd-front-mockup.jpg"),
    "Tape": FormatConfig("Tapes", "Cassette", ("cassette-front",), "cassette-front-mockup.jpg"),
    "Vinyl 10in": FormatConfig("Vinyl 10-inch", "Vinyl 10-inch", ("vinyl", "vinyl-square"), "vinyl-mockup.webp"),
    "Vinyl 12in": FormatConfig("Vinyl 12-inch", "Vinyl", ("vinyl", "vinyl-square"), "vinyl-mockup.webp"),
}


@dataclass(frozen=True)
class ManifestItem:
    row_number: str
    artist: str
    title: str
    normalized_format: str
    status: str
    local_path: str
    source: str = ""
    source_page_url: str = ""


@dataclass(frozen=True)
class ExistingDistroEntry:
    path: Path
    data: dict[str, object]

    @property
    def group(self) -> str:
        return str(self.data.get("group", ""))

    @property
    def artist(self) -> str:
        return str(self.data.get("artist_or_label", ""))

    @property
    def title(self) -> str:
        return str(self.data.get("title", ""))

    @property
    def image(self) -> str:
        return str(self.data.get("image", "")).removeprefix("./")


@dataclass(frozen=True)
class SyncAction:
    kind: str
    item: ManifestItem
    reason: str
    json_path: Path | None = None
    image_path: Path | None = None
    mockup_path: Path | None = None
    data: dict[str, object] | None = None


@dataclass(frozen=True)
class SyncResult:
    actions: list[SyncAction]
    errors: list[str]
    applied: bool

    def count(self, kind: str) -> int:
        return sum(1 for action in self.actions if action.kind == kind)


@dataclass(frozen=True)
class ResearchedMetadata:
    release_date: str = ""
    track_count: int = 0


def sync_manifest(
    manifest_path: Path,
    content_dir: Path = DEFAULT_CONTENT_DIR,
    mockups_root: Path | None = None,
    formats: set[str] | None = None,
    user_agent_contact: str = "example@example.com",
    apply: bool = False,
) -> SyncResult:
    manifest_path = manifest_path.resolve()
    content_dir = content_dir.resolve()
    mockups_root = (mockups_root or manifest_path.parent / "mockups").resolve()

    actions, errors = build_plan(manifest_path, content_dir, mockups_root, formats, user_agent_contact)
    if errors or not apply:
        return SyncResult(actions, errors, applied=False)

    for action in actions:
        if action.kind not in {"create", "update"}:
            continue
        if not action.json_path or not action.image_path or not action.mockup_path or action.data is None:
            raise RuntimeError(f"Incomplete sync action for row {action.item.row_number}")
        action.image_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(action.mockup_path, action.image_path)
        action.json_path.write_text(json.dumps(action.data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return SyncResult(actions, [], applied=True)


def build_plan(
    manifest_path: Path,
    content_dir: Path,
    mockups_root: Path,
    formats: set[str] | None = None,
    user_agent_contact: str = "example@example.com",
) -> tuple[list[SyncAction], list[str]]:
    entries = load_existing_entries(content_dir)
    errors = find_existing_duplicate_errors(entries)
    image_owners = map_image_owners(entries)
    entries_by_key = {identity_key(entry.artist, entry.title, entry.group): entry for entry in entries}
    next_order = next_distro_order(entries)
    http = Http(manifest_path.parent / ".cache", f"blackbox-distro-sync/1.0 (contact: {user_agent_contact})")
    actions: list[SyncAction] = []

    for item in read_manifest_items(manifest_path):
        config = SUPPORTED_FORMATS.get(item.normalized_format)
        if item.status != "downloaded":
            actions.append(SyncAction("skip", item, f"status is {item.status or 'blank'}"))
            continue
        if not config or (formats is not None and item.normalized_format not in formats):
            actions.append(SyncAction("skip", item, f"format {item.normalized_format or 'blank'} is not selected"))
            continue

        mockup_path = find_mockup_path(item, manifest_path, mockups_root, config)
        if not mockup_path:
            actions.append(SyncAction("skip", item, f"missing {config.mockup_suffix} mockup"))
            continue

        key = identity_key(item.artist, item.title, config.group)
        existing = entries_by_key.get(key)
        if not existing:
            possible = find_possible_duplicate(entries, item, config)
            if possible:
                errors.append(
                    f"Possible duplicate for row {item.row_number}: {item.artist} - {item.title} "
                    f"matches {possible.path.name}; not creating a second entry."
                )
                continue

        slug = existing.path.stem if existing else distro_slug(item, config)
        json_path = existing.path if existing else content_dir / f"{slug}.json"
        image_path = content_dir / f"{slug}{mockup_path.suffix.lower()}"
        owner = image_owners.get(image_path.name)
        if owner and owner != json_path:
            errors.append(f"Image filename collision for row {item.row_number}: {image_path.name} is used by {owner.name}.")
            continue
        if image_path.exists() and not owner and not existing:
            errors.append(f"Unowned image already exists for row {item.row_number}: {image_path.name}.")
            continue
        if json_path.exists() and not existing:
            errors.append(f"Slug collision for row {item.row_number}: {json_path.name} already exists.")
            continue

        if existing:
            metadata = research_metadata(item, config, http, user_agent_contact)
            data = updated_entry_data(existing, item, config, image_path.name, metadata)
            if metadata.release_date and "release_date" not in data:
                data["release_date"] = metadata.release_date
            action = SyncAction("update", item, f"existing {json_path.name}", json_path, image_path, mockup_path, data)
        else:
            metadata = research_metadata(item, config, http, user_agent_contact)
            data = new_entry_data(item, config, image_path.name, next_order, metadata)
            next_order += 1
            action = SyncAction("create", item, f"new {json_path.name}", json_path, image_path, mockup_path, data)
        validation_errors = validate_action(action, content_dir)
        if validation_errors:
            errors.extend(validation_errors)
            continue
        actions.append(action)

    return actions, errors


def read_manifest_items(path: Path) -> list[ManifestItem]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    return [
        ManifestItem(
            row_number=clean_text(row.get("row_number", "")),
            artist=clean_text(row.get("normalized_artist") or row.get("artist", "")),
            title=clean_text(row.get("normalized_title") or row.get("title", "")),
            normalized_format=clean_text(row.get("normalized_format") or row.get("format", "")),
            status=clean_text(row.get("status", "")),
            local_path=clean_text(row.get("local_path", "")),
            source=clean_text(row.get("source", "")),
            source_page_url=clean_text(row.get("source_page_url", "")),
        )
        for row in rows
    ]


def load_existing_entries(content_dir: Path) -> list[ExistingDistroEntry]:
    if not content_dir.exists():
        return []
    entries = []
    for path in sorted(content_dir.glob("*.json")):
        entries.append(ExistingDistroEntry(path.resolve(), json.loads(path.read_text(encoding="utf-8"))))
    return entries


def find_existing_duplicate_errors(entries: list[ExistingDistroEntry]) -> list[str]:
    owners_by_key: dict[tuple[str, str, str], list[Path]] = {}
    for entry in entries:
        owners_by_key.setdefault(identity_key(entry.artist, entry.title, entry.group), []).append(entry.path)
    return [
        f"Existing distro duplicate: {', '.join(path.name for path in paths)}"
        for paths in owners_by_key.values()
        if len(paths) > 1
    ]


def map_image_owners(entries: list[ExistingDistroEntry]) -> dict[str, Path]:
    return {entry.image: entry.path for entry in entries if entry.image}


def next_distro_order(entries: list[ExistingDistroEntry]) -> int:
    orders = [int(entry.data.get("order", 0)) for entry in entries if isinstance(entry.data.get("order", 0), int)]
    return (max(orders) + 1) if orders else 1


def identity_key(artist: str, title: str, group: str) -> tuple[str, str, str]:
    return (loose(artist), loose(title), clean_text(group).casefold())


def find_possible_duplicate(
    entries: list[ExistingDistroEntry],
    item: ManifestItem,
    config: FormatConfig,
) -> ExistingDistroEntry | None:
    matches = [
        entry
        for entry in entries
        if entry.group == config.group and names_match(item.artist, entry.artist) and names_match(item.title, entry.title)
    ]
    return matches[0] if len(matches) == 1 else None


def find_mockup_path(
    item: ManifestItem,
    manifest_path: Path,
    mockups_root: Path,
    config: FormatConfig,
) -> Path | None:
    cover_stem = resolve_cover_path(item, manifest_path).stem
    filename = f"{cover_stem}-{config.mockup_suffix}"
    candidate_dirs = [mockups_root, *(mockups_root / name for name in config.mockup_dirs)]
    for directory in candidate_dirs:
        candidate = directory / filename
        if candidate.exists():
            return candidate.resolve()
    matches = sorted(mockups_root.rglob(filename)) if mockups_root.exists() else []
    return matches[0].resolve() if matches else None


def resolve_cover_path(item: ManifestItem, manifest_path: Path) -> Path:
    raw_path = Path(item.local_path)
    if raw_path.is_absolute():
        return raw_path
    candidates = [
        Path.cwd() / raw_path,
        manifest_path.parent / raw_path,
        manifest_path.parent / "images" / raw_path.name,
        manifest_path.parent.parent / raw_path,
    ]
    return next((candidate for candidate in candidates if candidate.exists()), raw_path)


def distro_slug(item: ManifestItem, config: FormatConfig) -> str:
    slug = slugify(f"{item.artist} {item.title} {config.format_label}")
    return slug or f"distro-{item.row_number or 'item'}"


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", clean_text(value)).casefold()
    value = "".join(char for char in value if not unicodedata.combining(char))
    for greek, latin in {"ου": "u", "ει": "i", "οι": "i", "αι": "e", "υι": "i", "γγ": "ng"}.items():
        value = value.replace(greek, latin)
    return re.sub(r"[^a-z0-9]+", "-", value.translate(GREEK_TO_LATIN)).strip("-")


def new_entry_data(
    item: ManifestItem,
    config: FormatConfig,
    image_name: str,
    order: int,
    metadata: ResearchedMetadata,
) -> dict[str, object]:
    data: dict[str, object] = {
        "$schema": DISTRO_SCHEMA,
        "title": item.title,
        "group": config.group,
        "artist_or_label": item.artist,
        "image": image_name,
        "image_alt": image_alt(item, config),
        "summary": default_summary(item, config, metadata),
        "eyebrow": "Distro",
        "format": config.format_label,
        "order": order,
    }
    if metadata.release_date:
        data["release_date"] = metadata.release_date
    return data


def updated_entry_data(
    existing: ExistingDistroEntry,
    item: ManifestItem,
    config: FormatConfig,
    image_name: str,
    metadata: ResearchedMetadata,
) -> dict[str, object]:
    data = dict(existing.data)
    data["$schema"] = DISTRO_SCHEMA
    data["image"] = image_name
    data["image_alt"] = image_alt(item, config)
    if generated_summary(str(data.get("summary", "")), config):
        data["summary"] = default_summary(item, config, metadata)
    return data


def generated_summary(summary: str, config: FormatConfig) -> bool:
    return summary.startswith(f"{config.format_label} edition of ")


def validate_action(action: SyncAction, content_dir: Path) -> list[str]:
    data = action.data or {}
    errors = []
    if not action.json_path or not path_is_inside(action.json_path, content_dir) or action.json_path.suffix != ".json":
        errors.append(f"Invalid JSON output path for row {action.item.row_number}.")
    if not action.image_path or not path_is_inside(action.image_path, content_dir):
        errors.append(f"Invalid image output path for row {action.item.row_number}.")
    if not action.mockup_path or not action.mockup_path.exists():
        errors.append(f"Missing source mockup for row {action.item.row_number}.")

    required_strings = ("$schema", "title", "group", "artist_or_label", "image", "image_alt", "summary")
    for field in required_strings:
        if not isinstance(data.get(field), str) or not clean_text(str(data.get(field))):
            errors.append(f"Invalid distro {field} for row {action.item.row_number}.")
    if data.get("$schema") != DISTRO_SCHEMA:
        errors.append(f"Invalid distro $schema for row {action.item.row_number}.")
    if data.get("group") not in DISTRO_GROUPS:
        errors.append(f"Invalid distro group for row {action.item.row_number}: {data.get('group')}.")
    if type(data.get("order")) is not int or int(data.get("order", -1)) < 0:
        errors.append(f"Invalid distro order for row {action.item.row_number}.")

    image = str(data.get("image", "")).removeprefix("./")
    if Path(image).is_absolute() or ".." in Path(image).parts or Path(image).suffix.lower() not in IMAGE_SUFFIXES:
        errors.append(f"Invalid distro image path for row {action.item.row_number}: {image}.")
    if action.image_path and image != action.image_path.name:
        errors.append(f"Distro image mismatch for row {action.item.row_number}: {image} != {action.image_path.name}.")
    return errors


def path_is_inside(path: Path, directory: Path) -> bool:
    try:
        path.resolve().relative_to(directory.resolve())
        return True
    except ValueError:
        return False


def image_alt(item: ManifestItem, config: FormatConfig) -> str:
    if config.group == "Tapes":
        return f"{item.title} cassette case artwork mockup"
    return f"{item.title} {config.format_label} front mockup"


def default_summary(item: ManifestItem, config: FormatConfig, metadata: ResearchedMetadata) -> str:
    base = f"{config.format_label} edition of {item.title} by {item.artist}"
    facts = []
    if metadata.track_count:
        facts.append(f"{metadata.track_count}-track release")
    if metadata.release_date:
        facts.append(f"released {display_date(metadata.release_date)}")
    fact_phrase = ", ".join(facts)
    summary = (
        f"{base}. Source metadata identifies it as {indefinite_article(fact_phrase)} {fact_phrase}."
        if facts
        else f"{base} in the BlackBox Records distro catalog."
    )
    return f"{summary} {CASSETTE_MOCKUP_DISCLOSURE}" if config.group == "Tapes" else summary


def indefinite_article(phrase: str) -> str:
    normalized = phrase.strip().lower()
    if normalized.startswith(("8", "11", "18")) or normalized[:1] in {"a", "e", "i", "o", "u"}:
        return "an"
    return "a"


def research_metadata(item: ManifestItem, config: FormatConfig, http: Http, user_agent_contact: str) -> ResearchedMetadata:
    page_metadata = bandcamp_metadata(item, http) if is_bandcamp_url(item.source_page_url) else ResearchedMetadata()
    if page_metadata.release_date:
        return page_metadata
    musicbrainz = research_musicbrainz_metadata(item, config, http.cache_dir, user_agent_contact)
    return ResearchedMetadata(
        release_date=musicbrainz.release_date,
        track_count=page_metadata.track_count or musicbrainz.track_count,
    )


def bandcamp_metadata(item: ManifestItem, http: Http) -> ResearchedMetadata:
    from bs4 import BeautifulSoup

    html = http.text(item.source_page_url)
    if not html:
        return ResearchedMetadata()
    soup = BeautifulSoup(html, "html.parser")
    description = meta_content(soup, "description")
    release_date = parse_bandcamp_release_date(description)
    track_count = parse_track_count(meta_content(soup, "og:description"))
    return ResearchedMetadata(release_date=release_date, track_count=track_count)


def research_musicbrainz_metadata(
    item: ManifestItem,
    config: FormatConfig,
    cache_dir: Path,
    user_agent_contact: str,
) -> ResearchedMetadata:
    try:
        import musicbrainzngs
    except ImportError:
        return ResearchedMetadata()
    release = Release(0, item.artist, item.title, config.format_label, item.artist, item.title, item.normalized_format)
    path = cache_dir / f"distro-metadata-musicbrainz-{cache_key(item.artist + item.title + item.normalized_format)}.json"
    data = read_json(path)
    if data is None:
        try:
            musicbrainzngs.set_useragent("blackbox-distro-sync", "1.0", user_agent_contact)
            musicbrainzngs.set_rate_limit(limit_or_interval=1.0, new_requests=1)
            data = musicbrainzngs.search_releases(artist=item.artist, release=item.title, strict=True, limit=10)
            write_json(path, data)
        except Exception:
            return ResearchedMetadata()
    if not isinstance(data, dict):
        return ResearchedMetadata()
    candidates = []
    for candidate in data.get("release-list", []):
        media = ", ".join(medium.get("format", "") for medium in candidate.get("medium-list", []))
        score, confidence = score_confidence(release, candidate.get("artist-credit-phrase", ""), candidate.get("title", ""), media)
        date = parse_iso_date(candidate.get("date", ""))
        if confidence != "none" and date:
            candidates.append((score, date, track_count_from_musicbrainz(candidate)))
    if not candidates:
        return ResearchedMetadata()
    _, release_date, track_count = max(candidates, key=lambda candidate: (candidate[0], bool(candidate[1]), candidate[2]))
    return ResearchedMetadata(release_date=release_date, track_count=track_count)


def parse_bandcamp_release_date(description: str) -> str:
    for pattern in (r"\breleased\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})", r"\breleased\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})"):
        match = re.search(pattern, description, flags=re.IGNORECASE)
        if match:
            return parse_written_date(match.group(1))
    return ""


def parse_written_date(value: str) -> str:
    value = clean_text(value).rstrip(".")
    for fmt in ("%d %B %Y", "%d %b %Y", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            pass
    return ""


def parse_iso_date(value: str) -> str:
    value = clean_text(value)
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return value
    return ""


def parse_track_count(value: str) -> int:
    match = re.search(r"\b(\d{1,3})\s+track\b", value, flags=re.IGNORECASE)
    return int(match.group(1)) if match else 0


def track_count_from_musicbrainz(candidate: dict) -> int:
    total = 0
    for medium in candidate.get("medium-list", []):
        try:
            total += int(medium.get("track-count", 0))
        except (TypeError, ValueError):
            pass
    return total


def display_date(value: str) -> str:
    try:
        date = datetime.strptime(value, "%Y-%m-%d").date()
        return f"{date.strftime('%B')} {date.day}, {date.year}"
    except ValueError:
        return value


def parse_formats(values: list[str] | None) -> set[str] | None:
    if not values:
        return None
    selected = {clean_text(value) for value in values if clean_text(value)}
    unknown = selected - set(SUPPORTED_FORMATS)
    if unknown:
        raise ValueError(f"Unsupported format filter: {', '.join(sorted(unknown))}")
    return selected


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Dry-run or apply fetched artwork mockups into the Astro distro collection.")
    parser.add_argument("--manifest", required=True, type=Path, help="artwork-fetcher manifest.csv.")
    parser.add_argument("--content-dir", type=Path, default=DEFAULT_CONTENT_DIR, help="Astro distro content directory.")
    parser.add_argument("--mockups-root", type=Path, help="Mockups root. Defaults to <manifest-dir>/mockups.")
    parser.add_argument(
        "--format",
        dest="formats",
        action="append",
        choices=sorted(SUPPORTED_FORMATS),
        help="Limit import to a normalized format. Can be passed more than once.",
    )
    parser.add_argument("--apply", action="store_true", help="Write JSON files and copy mockup images. Default is dry-run.")
    parser.add_argument("--user-agent-contact", default="example@example.com", help="Contact string for metadata API User-Agent.")
    return parser


def main(argv: list[str] | None = None) -> int:
    configure_console()
    args = build_parser().parse_args(argv)
    try:
        formats = parse_formats(args.formats)
        result = sync_manifest(args.manifest, args.content_dir, args.mockups_root, formats, args.user_agent_contact, args.apply)
    except Exception as error:
        print(f"ERROR {error}", file=sys.stderr)
        return 1

    for error in result.errors:
        print(f"ERROR {error}", file=sys.stderr)
    for action in result.actions:
        target = action.json_path.name if action.json_path else "-"
        print(f"{action.kind.upper()} row {action.item.row_number or '?'} {action.item.artist} - {action.item.title} -> {target}: {action.reason}")

    mode = "applied" if result.applied else "dry-run"
    print(
        f"{mode}: {result.count('create')} create, {result.count('update')} update, "
        f"{result.count('skip')} skip, {len(result.errors)} error"
    )
    if result.errors:
        return 1
    if not result.applied:
        print("Pass --apply to write the planned distro JSON/image changes.")
    return 0


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


if __name__ == "__main__":
    raise SystemExit(main())
