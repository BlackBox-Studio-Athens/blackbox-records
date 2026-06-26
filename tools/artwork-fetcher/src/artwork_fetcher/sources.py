import logging
import os
from pathlib import Path
from urllib.parse import quote_plus
import asyncio
from dataclasses import asdict, is_dataclass

from .models import Candidate, Release
from .net import Http, cache_key, read_json, write_json
from .text import append_note, clean_text, format_mismatch_note, score_confidence


def bandcamp(release: Release, http: Http, overrides: dict[str, str]) -> Candidate | None:
    candidate = best(bandcamp_api_candidates(release, http.cache_dir))
    if candidate:
        return candidate
    urls = []
    override = overrides.get(f"{release.normalized_artist}\t{release.normalized_title}")
    if override:
        urls.append(override)
    urls.extend(bandcamp_search_urls(release, http))
    for url in urls[:5]:
        candidate = bandcamp_page(release, http, url, "Bandcamp override URL" if url == override else "Bandcamp search result")
        if candidate and candidate.image_url:
            return candidate
    return None


def bandcamp_api_candidates(release: Release, cache_dir: Path) -> list[Candidate]:
    path = cache_dir / f"bandcamp-search-{cache_key(release.normalized_artist + release.normalized_title)}.json"
    data = read_json(path)
    if data is None:
        try:
            data = asyncio.run(_bandcamp_search([f"{release.normalized_artist} {release.normalized_title}", release.normalized_title, release.normalized_artist]))
            write_json(path, data)
        except Exception as exc:  # noqa: BLE001
            logging.warning("Bandcamp search failed for %s: %s", release.normalized_title, exc)
            return []
    candidates = []
    seen = set()
    for item in data:
        url = item.get("url", "")
        item_type = item.get("type", "")
        if item_type not in {"album", "track"} or not url or url in seen:
            continue
        seen.add(url)
        matched_artist = item.get("artist_name", "")
        matched_title = item.get("name", "")
        if item_type == "track" and item.get("album_name"):
            matched_title = item["album_name"]
        score, confidence = score_confidence(release, matched_artist, matched_title)
        if confidence == "high":
            confidence = "medium"
        candidates.append(
            Candidate(
                source="Bandcamp",
                confidence=confidence,
                score=score + (25 if item_type == "album" else 10) + (20 if item.get("image_url") else 0),
                source_page_url=url,
                image_url=item.get("image_url", ""),
                matched_artist=matched_artist,
                matched_title=matched_title,
                notes=f"Bandcamp {item_type} search result",
            )
        )
    return candidates


async def _bandcamp_search(queries: list[str]) -> list[dict]:
    from bandcamp_async_api import BandcampAPIClient

    client = BandcampAPIClient()
    try:
        results = []
        for query in queries:
            results.extend(await client.search(query))
        return [asdict(item) if is_dataclass(item) else dict(item) for item in results]
    finally:
        await (await client._ensure_session()).close()


def bandcamp_search_urls(release: Release, http: Http) -> list[str]:
    from bs4 import BeautifulSoup

    query = quote_plus(f"{release.normalized_artist} {release.normalized_title}")
    html = http.text(f"https://bandcamp.com/search?q={query}&item_type=a")
    if not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    urls: list[str] = []
    for result in soup.select(".result-info"):
        text = clean_text(result.get_text(" "))
        if release.normalized_artist.casefold() not in text.casefold() or release.normalized_title.casefold() not in text.casefold():
            continue
        link = result.find("a", href=True)
        if link:
            urls.append(link["href"].split("?")[0])
    return urls


def bandcamp_page(release: Release, http: Http, url: str, note: str) -> Candidate | None:
    from bs4 import BeautifulSoup

    html = http.text(url)
    if not html:
        return None
    soup = BeautifulSoup(html, "html.parser")
    image_url = meta_content(soup, "og:image") or meta_content(soup, "twitter:image")
    title, artist = split_bandcamp_title(meta_content(soup, "og:title"))
    matched_artist = artist or release.normalized_artist
    matched_title = title or release.normalized_title
    score, confidence = score_confidence(release, matched_artist, matched_title)
    if confidence == "none":
        return None
    return Candidate(
        source="Bandcamp",
        confidence="medium" if confidence == "high" else confidence,
        score=score + (20 if image_url else 0),
        source_page_url=url,
        image_url=image_url,
        matched_artist=matched_artist,
        matched_title=matched_title,
        notes=note,
    )


def musicbrainz(release: Release, cache_dir: Path, contact: str) -> Candidate | None:
    try:
        import musicbrainzngs
    except ImportError:
        return None
    musicbrainzngs.set_useragent("release-artwork-fetcher", "1.0", contact)
    musicbrainzngs.set_rate_limit(limit_or_interval=1.0, new_requests=1)
    path = cache_dir / f"musicbrainz-{cache_key(release.normalized_artist + release.normalized_title + release.normalized_format)}.json"
    data = read_json(path)
    if data is None:
        try:
            data = musicbrainzngs.search_releases(artist=release.normalized_artist, release=release.normalized_title, strict=True, limit=10)
            write_json(path, data)
        except Exception as exc:  # noqa: BLE001
            logging.warning("MusicBrainz search failed for %s: %s", release.normalized_title, exc)
            return None
    candidates = []
    for item in data.get("release-list", []):
        media = ", ".join(medium.get("format", "") for medium in item.get("medium-list", []))
        score, confidence = score_confidence(release, item.get("artist-credit-phrase", ""), item.get("title", ""), media)
        image_url = cover_art_url(item.get("id", ""), cache_dir)
        candidates.append(
            Candidate(
                source="MusicBrainz/Cover Art Archive",
                confidence=confidence,
                score=score + (20 if image_url else 0),
                source_page_url=f"https://musicbrainz.org/release/{item.get('id', '')}",
                image_url=image_url,
                matched_artist=item.get("artist-credit-phrase", ""),
                matched_title=item.get("title", ""),
                matched_format=media,
                mbid=item.get("id", ""),
                notes=append_note(format_mismatch_note(release, media), "" if image_url else "MusicBrainz match has no approved front cover"),
            )
        )
    return best(candidates)


def cover_art_url(mbid: str, cache_dir: Path) -> str:
    if not mbid:
        return ""
    import musicbrainzngs

    path = cache_dir / f"coverart-{mbid}.json"
    data = read_json(path)
    if data is None:
        try:
            data = musicbrainzngs.get_image_list(mbid)
            write_json(path, data)
        except Exception as exc:  # noqa: BLE001
            logging.info("Cover Art Archive miss for %s: %s", mbid, exc)
            return ""
    for image in data.get("images", []):
        if image.get("front") or "Front" in image.get("types", []):
            return image.get("image", "")
    return ""


def discogs(release: Release, user_agent: str) -> Candidate | None:
    token = os.environ.get("DISCOGS_TOKEN")
    if not token:
        return None
    try:
        import discogs_client
    except ImportError:
        return None
    try:
        client = discogs_client.Client(user_agent, user_token=token)
        results = client.search(release.normalized_title, artist=release.normalized_artist, type="release")
    except Exception as exc:  # noqa: BLE001
        logging.warning("Discogs search failed for %s: %s", release.normalized_title, exc)
        return None
    candidates = []
    for item in list(results)[:10]:
        try:
            release_obj = client.release(item.id)
            matched_artist = ", ".join(getattr(artist, "name", "") for artist in getattr(release_obj, "artists", []))
            matched_title = getattr(release_obj, "title", "")
            matched_format = ", ".join(fmt.get("name", "") for fmt in getattr(release_obj, "formats", []))
            score, confidence = score_confidence(release, matched_artist, matched_title, matched_format)
            images = getattr(release_obj, "images", []) or []
            image_url = next((img.get("uri") or img.get("resource_url") for img in images if img.get("type") == "primary"), "")
            image_url = image_url or next((img.get("uri") or img.get("resource_url") for img in images), "")
            candidates.append(
                Candidate(
                    source="Discogs",
                    confidence=confidence,
                    score=score + (20 if image_url else 0),
                    source_page_url=getattr(release_obj, "url", ""),
                    image_url=image_url,
                    matched_artist=matched_artist,
                    matched_title=matched_title,
                    matched_format=matched_format,
                    discogs_release_id=str(getattr(release_obj, "id", "")),
                    notes=append_note(format_mismatch_note(release, matched_format), "" if image_url else "Discogs match has no exposed image"),
                )
            )
        except Exception as exc:  # noqa: BLE001
            logging.info("Discogs candidate failed for %s: %s", release.normalized_title, exc)
    return best(candidates)


def best(candidates: list[Candidate | None]) -> Candidate | None:
    candidates = [candidate for candidate in candidates if candidate and candidate.confidence != "none"]
    confidence_rank = {"low": 1, "medium": 2, "high": 3}
    return max(candidates, key=lambda candidate: (confidence_rank.get(candidate.confidence, 0), candidate.score)) if candidates else None


def meta_content(soup, key: str) -> str:
    tag = soup.find("meta", attrs={"property": key}) or soup.find("meta", attrs={"name": key})
    return clean_text(tag.get("content", "")) if tag else ""


def split_bandcamp_title(value: str) -> tuple[str, str]:
    if ", by " in value:
        title, artist = value.rsplit(", by ", 1)
        return clean_text(title), clean_text(artist)
    return clean_text(value), ""
