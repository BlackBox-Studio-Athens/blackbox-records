import csv
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

from .models import Release

GREEK_TO_LATIN = str.maketrans(
    {
        "α": "a",
        "β": "v",
        "γ": "g",
        "δ": "d",
        "ε": "e",
        "ζ": "z",
        "η": "i",
        "θ": "th",
        "ι": "i",
        "κ": "k",
        "λ": "l",
        "μ": "m",
        "ν": "n",
        "ξ": "x",
        "ο": "o",
        "π": "p",
        "ρ": "r",
        "σ": "s",
        "ς": "s",
        "τ": "t",
        "υ": "y",
        "φ": "f",
        "χ": "ch",
        "ψ": "ps",
        "ω": "o",
    }
)


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


def folded(value: str) -> str:
    value = unicodedata.normalize("NFKD", clean_text(value)).casefold()
    value = "".join(char for char in value if not unicodedata.combining(char))
    for greek, latin in {"ου": "u", "ει": "i", "οι": "i", "αι": "e", "υι": "i", "γγ": "ng"}.items():
        value = value.replace(greek, latin)
    return value.translate(GREEK_TO_LATIN).replace("ph", "f")


def loose(value: str) -> str:
    value = folded(value)
    value = re.sub(r"^(the|a|an)\s+", "", value)
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


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
    return score, "none"


def names_match(expected: str, actual: str) -> bool:
    expected = loose(expected)
    actual = loose(actual)
    if conflicting_release_suffix(expected, actual):
        return False
    return bool(
        expected
        and actual
        and (
            expected == actual
            or one_sided_suffix_match(expected, actual)
            or actual.startswith(f"{expected} ")
            or actual.startswith(f"{expected},")
            or SequenceMatcher(None, expected, actual).ratio() >= 0.83
            or acronym_matches(expected, actual)
        )
    )


def without_release_suffix(value: str) -> str:
    return re.sub(r"\s+(ep|lp|single|album)$", "", value).strip()


def release_suffix(value: str) -> str:
    match = re.search(r"\s+(ep|lp|single|album)$", value)
    return match.group(1) if match else ""


def conflicting_release_suffix(expected: str, actual: str) -> bool:
    expected_suffix = release_suffix(expected)
    actual_suffix = release_suffix(actual)
    return bool(
        expected_suffix
        and actual_suffix
        and expected_suffix != actual_suffix
        and without_release_suffix(expected) == without_release_suffix(actual)
    )


def one_sided_suffix_match(expected: str, actual: str) -> bool:
    expected_without_suffix = without_release_suffix(expected)
    actual_without_suffix = without_release_suffix(actual)
    expected_had_suffix = expected_without_suffix != expected
    actual_had_suffix = actual_without_suffix != actual
    return (
        expected_had_suffix
        != actual_had_suffix
        and expected_without_suffix == actual_without_suffix
    )


def acronym_matches(expected: str, actual: str) -> bool:
    compact = expected.replace(" ", "")
    if len(compact) < 4 or " " not in actual:
        return False
    acronym = "".join(word[0] for word in actual.split() if word)
    return len(acronym) - len(compact) <= 2 and is_subsequence(compact, acronym)


def is_subsequence(needle: str, haystack: str) -> bool:
    iterator = iter(haystack)
    return all(char in iterator for char in needle)


def search_variants(value: str) -> list[str]:
    variants = [clean_text(value), loose(value), without_release_suffix(loose(value))]
    return list(dict.fromkeys(item for item in variants if item))


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
