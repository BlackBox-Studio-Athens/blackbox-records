import csv
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

from .models import Release


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", value or "").strip())


def normalize_format(value: str) -> str:
    lower = clean_text(value).lower().replace('"', "''")
    if lower == "cd":
        return "CD"
    if lower == "tape":
        return "Tape"
    if lower in {"vinyl 12''", "vinyl 12'", "vinyl 12in", "vinyl 12 in"}:
        return "Vinyl 12in"
    return clean_text(value)


def comparable(value: str) -> str:
    return clean_text(value).casefold()


def loose(value: str) -> str:
    value = comparable(value)
    value = re.sub(r"^(the|a|an)\s+", "", value)
    return re.sub(r"[^a-z0-9α-ωάέήίόύώϊϋΐΰ]+", " ", value).strip()


def normalize_release(row_number: int, artist: str, title: str, fmt: str) -> Release:
    return Release(
        row_number=row_number,
        artist=artist,
        title=title,
        format=fmt,
        normalized_artist=clean_text(artist),
        normalized_title=clean_text(title),
        normalized_format=normalize_format(fmt),
    )


def parse_input(path: Path) -> list[Release]:
    text = path.read_text(encoding="utf-8-sig", newline="")
    delimiter = "\t" if path.suffix.lower() == ".tsv" or text[:2048].count("\t") >= text[:2048].count(",") else ","
    rows = list(csv.reader(text.splitlines(), delimiter=delimiter))
    if rows and [clean_text(cell).casefold() for cell in rows[0]][:3] == ["artist", "title", "format"]:
        rows = rows[1:]
    releases = []
    for index, row in enumerate(rows, 1):
        if not row or not any(map(clean_text, row)):
            continue
        if len(row) < 3:
            raise ValueError(f"Row {index} has fewer than 3 columns")
        releases.append(normalize_release(index, row[0], row[1], row[2]))
    return releases


def select_releases(releases: list[Release], limit: int | None) -> list[Release]:
    if limit is None or limit >= len(releases):
        return releases
    if limit == 3:
        pilot = [next((release for release in releases if release.normalized_format == fmt), None) for fmt in ("CD", "Tape", "Vinyl 12in")]
        if all(pilot):
            return pilot
    return releases[:limit]


def score_confidence(release: Release, matched_artist: str, matched_title: str, matched_format: str = "") -> tuple[int, str]:
    artist_match = names_match(release.normalized_artist, matched_artist)
    title_match = names_match(release.normalized_title, matched_title)
    format_match = format_matches(release.normalized_format, matched_format) if matched_format else True
    score = (45 if artist_match else 15) + (45 if title_match else 15) + (10 if format_match else -10)
    if artist_match and title_match and format_match:
        return score, "high"
    if artist_match and title_match and matched_format and not format_match:
        return score, "low"
    if artist_match and title_match:
        return score, "medium"
    if artist_match or title_match:
        return score, "low"
    return score, "none"


def names_match(expected: str, actual: str) -> bool:
    expected = loose(expected)
    actual = loose(actual)
    return bool(
        expected
        and actual
        and (
            expected == actual
            or actual.startswith(f"{expected} ")
            or actual.startswith(f"{expected},")
            or SequenceMatcher(None, expected, actual).ratio() >= 0.86
        )
    )


def format_matches(expected: str, candidate_format: str) -> bool:
    candidate = comparable(candidate_format)
    if expected == "CD":
        return "cd" in candidate
    if expected == "Tape":
        return "cassette" in candidate or "tape" in candidate
    if expected == "Vinyl 12in":
        return any(token in candidate for token in ("12", "vinyl", "lp"))
    return expected.casefold() in candidate


def append_note(existing: str, note: str) -> str:
    if not note:
        return existing
    return f"{existing}; {note}" if existing else note


def format_mismatch_note(release: Release, matched_format: str) -> str:
    if matched_format and not format_matches(release.normalized_format, matched_format):
        return f"Requested format {release.normalized_format}; matched source format {matched_format}"
    return ""
