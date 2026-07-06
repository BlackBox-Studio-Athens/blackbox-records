from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from urllib.parse import urlencode

from .models import Release
from .net import Http, cache_key, read_json, write_json
from .sources import is_bandcamp_url, meta_content
from .text import clean_text, format_matches, score_confidence


@dataclass(frozen=True)
class ResearchedMetadata:
    release_date: str = ""
    track_count: int = 0


@dataclass(frozen=True)
class ReleaseDateCandidate:
    date: str
    precision: str
    basis: str
    source_tier: str
    source_name: str
    source_url: str = ""
    matched_artist: str = ""
    matched_title: str = ""
    matched_format: str = ""
    confidence: str = "low"
    notes: str = ""
    score: int = 0


def research_metadata(item, config, http: Http, user_agent_contact: str) -> ResearchedMetadata:
    page_metadata = bandcamp_metadata(item, http) if is_bandcamp_url(item.source_page_url) else ResearchedMetadata()
    if page_metadata.release_date:
        return page_metadata
    musicbrainz = research_musicbrainz_metadata(item, config, http.cache_dir, user_agent_contact)
    return ResearchedMetadata(
        release_date=musicbrainz.release_date,
        track_count=page_metadata.track_count or musicbrainz.track_count,
    )


def bandcamp_metadata(item, http: Http) -> ResearchedMetadata:
    html = http.text(item.source_page_url)
    if not html:
        return ResearchedMetadata()
    release = Release(0, item.artist, item.title, "", item.artist, item.title, item.normalized_format)
    candidates = bandcamp_release_date_candidates_from_html(release, html, item.source_page_url)
    track_count = parse_track_count_from_html(html)
    return ResearchedMetadata(release_date=candidates[0].date if candidates else "", track_count=track_count)


def research_musicbrainz_metadata(
    item,
    config,
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
        date, _precision = parse_source_date(candidate.get("date", ""))
        if confidence != "none" and date:
            candidates.append((score, date, track_count_from_musicbrainz(candidate)))
    if not candidates:
        return ResearchedMetadata()
    _, release_date, track_count = max(candidates, key=lambda candidate: (candidate[0], bool(candidate[1]), candidate[2]))
    return ResearchedMetadata(release_date=release_date, track_count=track_count)


def bandcamp_release_date_candidates(release: Release, http: Http, url: str) -> list[ReleaseDateCandidate]:
    if not is_bandcamp_url(url):
        return []
    html = http.text(url)
    return bandcamp_release_date_candidates_from_html(release, html, url)


def bandcamp_release_date_candidates_from_html(release: Release, html: str, source_url: str) -> list[ReleaseDateCandidate]:
    if not html:
        return []
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    description = meta_content(soup, "description")
    date = parse_bandcamp_release_date(description)
    if not date:
        date = first_json_ld_date(html)
    if not date:
        return []
    title, artist = split_bandcamp_title(meta_content(soup, "og:title"))
    matched_artist = artist or release.normalized_artist
    matched_title = title or release.normalized_title
    score, confidence = score_confidence(release, matched_artist, matched_title)
    if confidence == "none":
        return []
    return [
        ReleaseDateCandidate(
            date=date,
            precision="day",
            basis="original_release",
            source_tier="official",
            source_name="Bandcamp",
            source_url=source_url,
            matched_artist=matched_artist,
            matched_title=matched_title,
            matched_format=release.normalized_format,
            confidence="high" if confidence in {"high", "medium"} else "low",
            notes="Bandcamp release metadata",
            score=score,
        )
    ]


def musicbrainz_date_candidates(release: Release, cache_dir: Path, contact: str) -> list[ReleaseDateCandidate]:
    try:
        import musicbrainzngs
    except ImportError:
        return []
    musicbrainzngs.set_useragent("release-date-research", "1.0", contact)
    musicbrainzngs.set_rate_limit(limit_or_interval=1.0, new_requests=1)
    path = cache_dir / f"release-date-musicbrainz-{cache_key(release.normalized_artist + release.normalized_title + release.normalized_format)}.json"
    data = read_json(path)
    if data is None:
        try:
            data = musicbrainzngs.search_releases(
                artist=release.normalized_artist,
                release=release.normalized_title,
                strict=True,
                limit=10,
            )
            write_json(path, data)
        except Exception as exc:  # noqa: BLE001
            logging.warning("MusicBrainz date search failed for %s: %s", release.normalized_title, exc)
            return []
    return musicbrainz_date_candidates_from_data(release, data if isinstance(data, dict) else {})


def musicbrainz_date_candidates_from_data(release: Release, data: dict) -> list[ReleaseDateCandidate]:
    candidates: list[ReleaseDateCandidate] = []
    for item in data.get("release-list", []):
        date, precision = parse_source_date(item.get("date", ""))
        if not date:
            continue
        media = ", ".join(medium.get("format", "") for medium in item.get("medium-list", []))
        score, confidence = score_confidence(release, item.get("artist-credit-phrase", ""), item.get("title", ""), media)
        if confidence == "none":
            continue
        matched_format = media
        basis = "format_release" if matched_format and format_matches(release.normalized_format, matched_format) else "original_release"
        candidates.append(
            ReleaseDateCandidate(
                date=date,
                precision=precision,
                basis=basis,
                source_tier="catalog_database",
                source_name="MusicBrainz",
                source_url=f"https://musicbrainz.org/release/{item.get('id', '')}" if item.get("id") else "",
                matched_artist=item.get("artist-credit-phrase", ""),
                matched_title=item.get("title", ""),
                matched_format=matched_format,
                confidence=confidence,
                notes="MusicBrainz release date",
                score=score,
            )
        )
    return candidates


def discogs_date_candidates(release: Release, http: Http) -> list[ReleaseDateCandidate]:
    token = os.environ.get("DISCOGS_TOKEN")
    if not token:
        return []
    headers = {"Authorization": f"Discogs token={token}"}
    query = urlencode(
        {
            "artist": release.normalized_artist,
            "release_title": release.normalized_title,
            "type": "release",
            "per_page": "5",
        }
    )
    data = http.json(f"https://api.discogs.com/database/search?{query}", headers=headers)
    if not isinstance(data, dict):
        return []
    candidates: list[ReleaseDateCandidate] = []
    for item in data.get("results", [])[:5]:
        release_id = str(item.get("id", ""))
        resource_url = item.get("resource_url") or (f"https://api.discogs.com/releases/{release_id}" if release_id else "")
        release_data = http.json(str(resource_url), headers=headers) if resource_url else None
        if isinstance(release_data, dict):
            candidate = discogs_date_candidate_from_data(release, release_data)
            if candidate:
                candidates.append(candidate)
    return candidates


def discogs_date_candidate_from_data(release: Release, data: dict) -> ReleaseDateCandidate | None:
    released = data.get("released") or data.get("released_formatted") or data.get("year") or ""
    date, precision = parse_source_date(str(released))
    if not date:
        return None
    matched_artist = data.get("artists_sort") or ", ".join(
        str(artist.get("name", "")) for artist in data.get("artists", []) if isinstance(artist, dict)
    )
    matched_title = str(data.get("title", ""))
    matched_format = ", ".join(str(fmt.get("name", "")) for fmt in data.get("formats", []) if isinstance(fmt, dict))
    score, confidence = score_confidence(release, matched_artist, matched_title, matched_format)
    if confidence == "none":
        return None
    basis = "format_release" if matched_format and format_matches(release.normalized_format, matched_format) else "original_release"
    return ReleaseDateCandidate(
        date=date,
        precision=precision,
        basis=basis,
        source_tier="catalog_database",
        source_name="Discogs",
        source_url=str(data.get("uri") or (f"https://www.discogs.com/release/{data.get('id')}" if data.get("id") else "")),
        matched_artist=matched_artist,
        matched_title=matched_title,
        matched_format=matched_format,
        confidence=confidence,
        notes="Discogs release date",
        score=score,
    )


def retailer_date_candidate_from_payload(release: Release, payload: dict) -> ReleaseDateCandidate | None:
    date, precision = parse_source_date(str(payload.get("release_date") or payload.get("date") or ""))
    if not date:
        return None
    matched_artist = str(payload.get("artist") or release.normalized_artist)
    matched_title = str(payload.get("title") or release.normalized_title)
    matched_format = str(payload.get("format") or release.normalized_format)
    score, confidence = score_confidence(release, matched_artist, matched_title, matched_format)
    if confidence == "none":
        return None
    return ReleaseDateCandidate(
        date=date,
        precision=precision,
        basis=str(payload.get("basis") or "store_availability"),
        source_tier="retailer",
        source_name=str(payload.get("source_name") or "Retailer"),
        source_url=str(payload.get("source_url") or ""),
        matched_artist=matched_artist,
        matched_title=matched_title,
        matched_format=matched_format,
        confidence="medium" if confidence == "high" else confidence,
        notes="Retailer date evidence",
        score=score,
    )


def dsp_date_candidate_from_payload(release: Release, payload: dict) -> ReleaseDateCandidate | None:
    raw_date = str(payload.get("release_date") or payload.get("upload_date") or payload.get("date") or "")
    date, precision = parse_source_date(raw_date)
    if not date:
        return None
    matched_artist = str(payload.get("artist") or release.normalized_artist)
    matched_title = str(payload.get("title") or release.normalized_title)
    score, confidence = score_confidence(release, matched_artist, matched_title)
    if confidence == "none":
        return None
    return ReleaseDateCandidate(
        date=date,
        precision=precision,
        basis="platform_upload",
        source_tier="dsp",
        source_name=str(payload.get("source_name") or "DSP"),
        source_url=str(payload.get("source_url") or ""),
        matched_artist=matched_artist,
        matched_title=matched_title,
        matched_format=str(payload.get("format") or ""),
        confidence="low",
        notes="Platform Upload Date evidence only",
        score=score,
    )


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
    date, precision = parse_source_date(value)
    return date if precision == "day" else ""


def parse_source_date(value: str) -> tuple[str, str]:
    value = clean_text(value)
    if re.fullmatch(r"\d{8}", value):
        value = f"{value[:4]}-{value[4:6]}-{value[6:]}"
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        try:
            datetime.strptime(value, "%Y-%m-%d")
            return value, "day"
        except ValueError:
            return "", ""
    if re.fullmatch(r"\d{4}-\d{2}", value):
        try:
            datetime.strptime(value, "%Y-%m")
            return value, "month"
        except ValueError:
            return "", ""
    if re.fullmatch(r"\d{4}", value):
        return value, "year"
    written_date = parse_written_date(value)
    return (written_date, "day") if written_date else ("", "")


def parse_track_count(value: str) -> int:
    match = re.search(r"\b(\d{1,3})\s+track\b", value, flags=re.IGNORECASE)
    return int(match.group(1)) if match else 0


def parse_track_count_from_html(html: str) -> int:
    if not html:
        return 0
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    return parse_track_count(meta_content(soup, "og:description"))


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


def first_json_ld_date(html: str) -> str:
    for match in re.finditer(
        r"<script[^>]+type=[\"']application/ld\+json[\"'][^>]*>(.*?)</script>",
        html,
        flags=re.IGNORECASE | re.DOTALL,
    ):
        try:
            import json

            date = find_date_in_json(json.loads(match.group(1).strip()))
        except Exception:  # noqa: BLE001
            continue
        if date:
            return date
    return ""


def find_date_in_json(value: object) -> str:
    if isinstance(value, dict):
        for key in ("datePublished", "releaseDate", "dateCreated"):
            date, precision = parse_source_date(str(value.get(key, "")))
            if date and precision == "day":
                return date
        for child in value.values():
            date = find_date_in_json(child)
            if date:
                return date
    if isinstance(value, list):
        for child in value:
            date = find_date_in_json(child)
            if date:
                return date
    return ""


def split_bandcamp_title(value: str) -> tuple[str, str]:
    if " | " not in value:
        return clean_text(value), ""
    title, artist = value.split(" | ", 1)
    return clean_text(title), clean_text(artist)
