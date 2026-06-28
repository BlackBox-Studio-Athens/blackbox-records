import argparse
import json
import logging
from pathlib import Path

from .files import write_manual_review, write_manifest
from .runner import ArtworkFetcher
from .text import parse_input, select_releases


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fetch front-cover artwork for a CSV/TSV release list.")
    parser.add_argument("--input", required=True, type=Path, help="CSV/TSV file with artist,title,format columns.")
    parser.add_argument("--out", default=Path("./artwork"), type=Path, help="Output directory.")
    parser.add_argument("--manifest", default=None, type=Path, help="Manifest CSV path. Defaults to <out>/manifest.csv.")
    parser.add_argument("--limit", type=int, default=None, help="Limit processed releases. Limit 3 picks CD/Tape/Vinyl pilot.")
    parser.add_argument("--dry-run", action="store_true", help="Resolve candidates but do not download images.")
    parser.add_argument("--force", action="store_true", help="Allow new collision filenames when prior files exist.")
    parser.add_argument("--user-agent-contact", default="example@example.com", help="Contact string for API User-Agent.")
    parser.add_argument(
        "--artwork-overrides",
        "--bandcamp-overrides",
        dest="artwork_overrides",
        type=Path,
        help="Optional JSON map of 'Artist<TAB>Title' to a verified artwork, Bandcamp, or Discogs release URL.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    out_dir = args.out
    manifest_path = args.manifest or out_dir / "manifest.csv"
    setup_logging(out_dir / "logs")
    overrides = load_overrides(resolve_artwork_overrides_path(args.input, args.artwork_overrides))
    fetcher = ArtworkFetcher(out_dir=out_dir, user_agent_contact=args.user_agent_contact, artwork_overrides=overrides)
    fetcher.prepare()

    releases = select_releases(parse_input(args.input), args.limit)
    logging.info("Processing %s release(s)", len(releases))
    results = []
    for release in releases:
        logging.info("%03d %s - %s [%s]", release.row_number, release.normalized_artist, release.normalized_title, release.normalized_format)
        result = fetcher.fetch_release(release, force=args.force, dry_run=args.dry_run)
        results.append(result)
        logging.info("%s %s %s", result.status, result.confidence, result.local_path or result.notes)

    write_manifest(manifest_path, results)
    write_manual_review(out_dir / "manual_review.tsv", results)
    logging.info("Wrote %s", manifest_path)
    logging.info("Wrote %s", out_dir / "manual_review.tsv")
    return 0


def resolve_artwork_overrides_path(input_path: Path, explicit_path: Path | None) -> Path | None:
    if explicit_path:
        return explicit_path
    sibling = input_path.with_name(f"{input_path.stem}_overrides.json")
    return sibling if sibling.exists() else None


def load_overrides(path: Path | None) -> dict[str, object]:
    if not path:
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def setup_logging(logs_dir: Path) -> None:
    logs_dir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[logging.StreamHandler(), logging.FileHandler(logs_dir / "fetch.log", encoding="utf-8")],
        force=True,
    )
