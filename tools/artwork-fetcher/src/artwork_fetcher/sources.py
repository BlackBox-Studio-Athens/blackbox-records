import logging
import json
import os
import re
from pathlib import Path
from urllib.parse import quote_plus, urlencode, urlparse
import asyncio
from dataclasses import asdict, is_dataclass

from .models import Candidate, Release
from .net import Http, cache_key, read_json, write_json
from .text import append_note, clean_text, format_mismatch_note, names_match, score_confidence, search_variants


def artwork_override(release: Release, http: Http, overrides: dict[str, object]) -> Candidate | None:
    override = overrides.get(f"{release.normalized_artist}\t{release.normalized_title}")
    if override_marked_missing(override):
        return Candidate(
            source="Known missing",
            confidence="low",
            score=0,
            source_page_url=override_url(override),
            notes=append_note("known missing artwork", override_note(override)),
        )
    url = override_url(override)
    image_url = override_image_url(override)
    if not url and not image_url:
        return None
    verified = override_verified(override)
    candidate = override_candidate_from_url(release, http, url, verified, image_url)
    if candidate and verified:
        candidate.confidence = "high"
        candidate.score += 50
        candidate.notes = append_note(candidate.notes, "verified override")
    return candidate


def override_candidate_from_url(release: Release, http: Http, url: str, verified: bool, image_url: str = "") -> Candidate | None:
    if image_url:
        return manual_image_candidate(url, image_url, verified)
    release_id = discogs_release_id_from_url(url)
    if release_id:
        return discogs_release_candidate(release, http, release_id, "Discogs override URL", verified)
    if is_bandcamp_url(url):
        return bandcamp_page(release, http, url, "Bandcamp override URL")
    if is_direct_image_url(url):
        return manual_image_candidate(url, url, verified)
    return None


def manual_image_candidate(source_page_url: str, image_url: str, verified: bool) -> Candidate:
    return Candidate(
        source="Manual override",
        confidence="medium" if not verified else "high",
        score=120,
        source_page_url=source_page_url or image_url,
        image_url=image_url,
        notes="direct image override",
    )


def bandcamp(release: Release, http: Http) -> Candidate | None:
    candidates = bandcamp_api_candidates(release, http.cache_dir)
    candidate = best(candidates)
    if candidate:
        return candidate
    candidates = []
    for url in bandcamp_search_urls(release, http)[:5]:
        candidate = bandcamp_page(release, http, url, "Bandcamp search result")
        if candidate and candidate.image_url:
            candidates.append(candidate)
    return best(candidates)


def override_url(value: object) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        url = value.get("url", "")
        return url if isinstance(url, str) else ""
    return ""


def override_image_url(value: object) -> str:
    if isinstance(value, dict):
        url = value.get("image_url") or value.get("imageUrl") or ""
        return url if isinstance(url, str) else ""
    return ""


def override_verified(value: object) -> bool:
    return isinstance(value, dict) and bool(value.get("verified"))


def override_marked_missing(value: object) -> bool:
    return isinstance(value, dict) and bool(value.get("missing"))


def override_note(value: object) -> str:
    if isinstance(value, dict):
        note = value.get("note", "")
        return note if isinstance(note, str) else ""
    return ""


def is_direct_image_url(url: str) -> bool:
    return Path(urlparse(url).path).suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}


def is_bandcamp_url(url: str) -> bool:
    hostname = urlparse(url).hostname or ""
    return hostname == "bandcamp.com" or hostname.endswith(".bandcamp.com")


def bandcamp_cassette_product_image_urls(html: str) -> list[str]:
    urls: list[str] = []
    seen = set()
    for item in bandcamp_json_ld_items(html):
        if not bandcamp_json_ld_item_is_cassette_product(item):
            continue
        for url in json_ld_image_urls(item.get("image")):
            if url not in seen:
                seen.add(url)
                urls.append(url)
    return urls


def bandcamp_json_ld_items(html: str) -> list[dict]:
    items: list[dict] = []
    for match in re.finditer(
        r"<script[^>]+type=[\"']application/ld\+json[\"'][^>]*>(.*?)</script>",
        html,
        flags=re.IGNORECASE | re.DOTALL,
    ):
        try:
            data = json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            continue
        items.extend(dicts_in_json_ld(data))
    return items


def dicts_in_json_ld(value: object) -> list[dict]:
    if isinstance(value, dict):
        items = [value]
        for child in value.values():
            items.extend(dicts_in_json_ld(child))
        return items
    if isinstance(value, list):
        items = []
        for child in value:
            items.extend(dicts_in_json_ld(child))
        return items
    return []


def bandcamp_json_ld_item_is_cassette_product(item: dict) -> bool:
    item_type = item.get("@type")
    types = item_type if isinstance(item_type, list) else [item_type]
    if "Product" not in types and "MusicRelease" not in types:
        return False
    if "Cassette" in str(item.get("musicReleaseFormat", "")):
        return True
    for prop in item.get("additionalProperty", []) or []:
        if not isinstance(prop, dict):
            continue
        name = str(prop.get("name", ""))
        value = str(prop.get("value", ""))
        if name == "type_name" and value == "Cassette":
            return True
    return False


def json_ld_image_urls(value: object) -> list[str]:
    if isinstance(value, str):
        return [value] if is_direct_image_url(value) else []
    if isinstance(value, list):
        return [url for item in value for url in json_ld_image_urls(item)]
    return []


def discogs_release_id_from_url(url: str) -> str:
    match = re.search(r"/release/(\d+)", urlparse(url).path)
    return match.group(1) if match else ""


def bandcamp_api_candidates(release: Release, cache_dir: Path) -> list[Candidate]:
    artist_variants = search_variants(release.normalized_artist)
    title_variants = search_variants(release.normalized_title)
    query_groups = {
        "strict": [f"{artist} {title}" for artist in artist_variants for title in title_variants],
        "broad": title_variants + artist_variants,
    }
    data = []
    for group, queries in query_groups.items():
        path = cache_dir / f"bandcamp-search-v4-{group}-{cache_key(release.normalized_artist + release.normalized_title)}.json"
        group_data = read_json(path)
        if group_data is None:
            try:
                group_data = asyncio.run(_bandcamp_search(queries))
                write_json(path, group_data)
            except Exception as exc:  # noqa: BLE001
                logging.warning("Bandcamp search failed for %s: %s", release.normalized_title, exc)
                group_data = []
        data.extend(group_data)
        candidates = bandcamp_candidates_from_data(release, data)
        candidate = best(candidates)
        if candidate and candidate.image_url and candidate.confidence in {"high", "medium"}:
            return candidates
    return bandcamp_candidates_from_data(release, data)


def bandcamp_candidates_from_data(release: Release, data: list[dict]) -> list[Candidate]:
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
            try:
                results.extend(await client.search(query))
            except Exception as exc:  # noqa: BLE001
                wait = int(getattr(exc, "retry_after", 0) or 0)
                if wait <= 0:
                    logging.info("Bandcamp query skipped for %s: %s", query, exc)
                    continue
                logging.info("Bandcamp rate limit for %s; retrying after %ss", query, wait)
                await asyncio.sleep(wait)
                try:
                    results.extend(await client.search(query))
                except Exception as retry_exc:  # noqa: BLE001
                    logging.info("Bandcamp query skipped after retry for %s: %s", query, retry_exc)
            await asyncio.sleep(0.35)
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
        image = cover_art_image(item.get("id", ""), cache_dir)
        image = image or release_group_cover_art_image(item.get("release-group", {}).get("id", ""), cache_dir)
        image_url = image.get("image", "") if image else ""
        candidates.append(
            Candidate(
                source="MusicBrainz/Cover Art Archive",
                confidence=confidence,
                score=score + (20 if image_url else 0),
                source_page_url=f"https://musicbrainz.org/release/{item.get('id', '')}",
                image_url=image_url,
                thumbnail_url=cover_art_thumbnail_url(image),
                image_score=cover_art_image_score(image),
                matched_artist=item.get("artist-credit-phrase", ""),
                matched_title=item.get("title", ""),
                matched_format=media,
                mbid=item.get("id", ""),
                notes=append_note(format_mismatch_note(release, media), "" if image_url else "MusicBrainz match has no approved front cover"),
            )
        )
    return best(candidates)


def cover_art_image(mbid: str, cache_dir: Path) -> dict:
    if not mbid:
        return {}
    import musicbrainzngs

    path = cache_dir / f"coverart-{mbid}.json"
    data = read_json(path)
    if data is None:
        try:
            data = musicbrainzngs.get_image_list(mbid)
            write_json(path, data)
        except Exception as exc:  # noqa: BLE001
            logging.info("Cover Art Archive miss for %s: %s", mbid, exc)
            return {}
    return best_cover_art_image(data.get("images", []))


def release_group_cover_art_image(release_group_mbid: str, cache_dir: Path) -> dict:
    if not release_group_mbid:
        return {}
    import musicbrainzngs

    path = cache_dir / f"coverart-release-group-{release_group_mbid}.json"
    data = read_json(path)
    if data is None:
        try:
            data = musicbrainzngs.get_release_group_image_list(release_group_mbid)
            write_json(path, data)
        except Exception as exc:  # noqa: BLE001
            logging.info("Cover Art Archive release-group miss for %s: %s", release_group_mbid, exc)
            return {}
    return best_cover_art_image(data.get("images", []))


def best_cover_art_image(images: list[dict]) -> dict:
    front_images = [image for image in images if image.get("front") or "Front" in image.get("types", [])]
    return max(front_images, key=cover_art_image_score, default={})


def cover_art_image_score(image: dict | None) -> int:
    thumbnails = (image or {}).get("thumbnails", {}) or {}
    sizes = [int(key) for key in thumbnails if str(key).isdigit()]
    if thumbnails.get("large"):
        sizes.append(500)
    if thumbnails.get("small"):
        sizes.append(250)
    return max(sizes, default=0)


def cover_art_thumbnail_url(image: dict | None) -> str:
    thumbnails = (image or {}).get("thumbnails", {}) or {}
    return thumbnails.get("250") or thumbnails.get("small") or thumbnails.get("500") or thumbnails.get("large") or ""


def discogs(release: Release, http: Http) -> Candidate | None:
    token = os.environ.get("DISCOGS_TOKEN")
    if not token:
        return None
    headers = {"Authorization": f"Discogs token={token}"}
    candidates = []
    seen_release_ids = set()
    for data in discogs_searches(release, http, headers):
        for item in data.get("results", [])[:10]:
            release_id = str(item.get("id", ""))
            if release_id and release_id not in seen_release_ids:
                seen_release_ids.add(release_id)
                candidates.append(discogs_release_candidate(release, http, release_id, "Discogs search result"))
    return best(candidates)


def discogs_searches(release: Release, http: Http, headers: dict[str, str]) -> list[dict]:
    searches = [
        {
            "q": f"{release.normalized_artist} {release.normalized_title}",
            "release_title": release.normalized_title,
            "artist": release.normalized_artist,
            "type": "release",
            "per_page": "10",
            "page": "1",
        },
        {
            "q": f"{release.normalized_artist} {without_discogs_noise(release.normalized_title)}",
            "type": "release",
            "per_page": "10",
            "page": "1",
        },
    ]
    results = []
    for search in searches:
        try:
            data = http.json(f"https://api.discogs.com/database/search?{urlencode(search)}", headers=headers)
        except Exception as exc:  # noqa: BLE001
            logging.warning("Discogs search failed for %s: %s", release.normalized_title, exc)
            continue
        if isinstance(data, dict):
            results.append(data)
    return results


def discogs_release_candidate(release: Release, http: Http, release_id: str, note: str, verified: bool = False) -> Candidate | None:
    token = os.environ.get("DISCOGS_TOKEN")
    headers = {"Authorization": f"Discogs token={token}"} if token else {}
    try:
        release_obj = http.json(f"https://api.discogs.com/releases/{release_id}", headers=headers)
        if not isinstance(release_obj, dict):
            return None
        matched_artist = ", ".join(artist.get("name", "") for artist in release_obj.get("artists", []))
        matched_title = release_obj.get("title", "")
        matched_format = ", ".join(fmt.get("name", "") for fmt in release_obj.get("formats", []))
        score, confidence = score_confidence(release, matched_artist, matched_title, matched_format)
        if verified and confidence == "none":
            confidence = "high"
            score = 120
        if confidence == "none":
            return None
        image = best_discogs_image(release_obj.get("images", []) or [])
        image_url = image.get("uri") or image.get("resource_url", "")
        return Candidate(
            source="Discogs",
            confidence=confidence,
            score=score + (20 if image_url else 0),
            source_page_url=release_obj.get("uri", ""),
            image_url=image_url,
            thumbnail_url=image.get("uri150", ""),
            image_width=as_int(image.get("width")),
            image_height=as_int(image.get("height")),
            image_score=discogs_image_score(image),
            matched_artist=matched_artist,
            matched_title=matched_title,
            matched_format=matched_format,
            discogs_release_id=release_id,
            notes=append_note(append_note(format_mismatch_note(release, matched_format), note), "" if image_url else "Discogs match has no exposed image"),
        )
    except Exception as exc:  # noqa: BLE001
        logging.info("Discogs candidate failed for %s: %s", release.normalized_title, exc)
        return None


def without_discogs_noise(value: str) -> str:
    return clean_text(re.sub(r"\bfest\b", "", value, flags=re.IGNORECASE))


def youtube(release: Release, cache_dir: Path) -> Candidate | None:
    path = cache_dir / f"youtube-v1-{cache_key(release.normalized_artist + release.normalized_title)}.json"
    data = read_json(path)
    if data is None:
        data = youtube_search(release)
        write_json(path, data)
    if not isinstance(data, dict):
        return None
    return best(youtube_candidates_from_data(release, data))


def youtube_search(release: Release) -> dict:
    try:
        import yt_dlp
    except ImportError:
        logging.info("YouTube lookup skipped; yt-dlp is not installed")
        return {}
    query = f'ytsearch5:"{release.normalized_artist}" "{release.normalized_title}" official audio'
    options = {
        "extract_flat": "in_playlist",
        "ignoreerrors": True,
        "no_warnings": True,
        "noplaylist": True,
        "quiet": True,
        "skip_download": True,
        "socket_timeout": 20,
    }
    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            return ydl.sanitize_info(ydl.extract_info(query, download=False))
    except Exception as exc:  # noqa: BLE001
        logging.info("YouTube lookup failed for %s: %s", release.normalized_title, exc)
        return {}


def youtube_candidates_from_data(release: Release, data: dict) -> list[Candidate]:
    return [
        candidate
        for entry in data.get("entries", [])[:5]
        if isinstance(entry, dict)
        if (candidate := youtube_candidate_from_entry(release, entry))
    ]


def youtube_candidate_from_entry(release: Release, entry: dict) -> Candidate | None:
    title = clean_text(entry.get("title", ""))
    matched_artist, matched_title = youtube_artist_title(release, entry)
    score, confidence = score_confidence(release, matched_artist, matched_title)
    if confidence == "none":
        return None
    if confidence == "high":
        confidence = "medium"
    thumbnail = best_youtube_thumbnail(entry.get("thumbnails", []) or [])
    thumbnail_url = thumbnail.get("url", "")
    image_url = thumbnail_url if youtube_thumbnail_is_cover_like(thumbnail) else ""
    score += youtube_score_boost(entry, title, bool(image_url))
    return Candidate(
        source="YouTube",
        confidence=confidence,
        score=score,
        source_page_url=youtube_watch_url(entry),
        image_url=image_url,
        thumbnail_url=thumbnail_url,
        image_width=as_int(thumbnail.get("width")),
        image_height=as_int(thumbnail.get("height")),
        image_score=as_int(thumbnail.get("width")) * as_int(thumbnail.get("height")) if image_url else 0,
        matched_artist=matched_artist,
        matched_title=matched_title,
        notes="YouTube yt-dlp search result",
    )


def youtube_artist_title(release: Release, entry: dict) -> tuple[str, str]:
    title = clean_youtube_title(entry.get("title", ""))
    for separator in (" - ", " – ", " — "):
        if separator in title:
            artist, candidate_title = title.split(separator, 1)
            if names_match(release.normalized_artist, artist):
                return clean_text(artist), clean_youtube_title(candidate_title)
    channel_artist = youtube_channel_artist(entry)
    if channel_artist and names_match(release.normalized_artist, channel_artist):
        return channel_artist, title
    return "", title


def youtube_channel_artist(entry: dict) -> str:
    channel = clean_text(entry.get("channel") or entry.get("uploader") or "")
    return clean_text(re.sub(r"\s*-\s*Topic$", "", channel, flags=re.IGNORECASE))


def clean_youtube_title(value: str) -> str:
    value = clean_text(value)
    value = re.sub(r"\s*[\[(](official\s+)?(audio|video|music video|lyric video|lyrics|visualizer)[\])]\s*$", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s*[\[(](full album|album stream)[\])]\s*$", "", value, flags=re.IGNORECASE)
    return clean_text(value)


def youtube_score_boost(entry: dict, title: str, cover_like_thumbnail: bool) -> int:
    boost = 0
    channel = clean_text(entry.get("channel") or entry.get("uploader") or "")
    if re.search(r"\s-\sTopic$", channel, flags=re.IGNORECASE):
        boost += 20
    if re.search(r"official\s+audio|provided\s+to\s+youtube", title, flags=re.IGNORECASE):
        boost += 10
    if cover_like_thumbnail:
        boost += 10
    if "reaction" in title.casefold() or "review" in title.casefold():
        boost -= 30
    return boost


def best_youtube_thumbnail(thumbnails: list[dict]) -> dict:
    usable = [thumbnail for thumbnail in thumbnails if thumbnail.get("url")]
    cover_like = [thumbnail for thumbnail in usable if youtube_thumbnail_is_cover_like(thumbnail)]
    return max(cover_like or usable, key=lambda thumbnail: as_int(thumbnail.get("width")) * as_int(thumbnail.get("height")), default={})


def youtube_thumbnail_is_cover_like(thumbnail: dict) -> bool:
    width = as_int(thumbnail.get("width"))
    height = as_int(thumbnail.get("height"))
    if not width or not height:
        return False
    ratio = width / height
    return 0.85 <= ratio <= 1.15


def youtube_watch_url(entry: dict) -> str:
    url = entry.get("webpage_url") or entry.get("url") or ""
    if isinstance(url, str) and url.startswith("http"):
        return url
    video_id = entry.get("id") or url
    return f"https://www.youtube.com/watch?v={video_id}" if video_id else ""


def best_discogs_image(images: list[dict]) -> dict:
    primary = [image for image in images if image.get("type") == "primary"]
    return max(primary or images, key=discogs_image_score, default={})


def discogs_image_score(image: dict | None) -> int:
    return as_int((image or {}).get("width")) * as_int((image or {}).get("height"))


def as_int(value: object) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def best(candidates: list[Candidate | None]) -> Candidate | None:
    candidates = [candidate for candidate in candidates if candidate and candidate.confidence != "none"]
    confidence_rank = {"low": 1, "medium": 2, "high": 3}
    return (
        max(
            candidates,
            key=lambda candidate: (
                bool(candidate.image_url),
                confidence_rank.get(candidate.confidence, 0),
                candidate.score,
                candidate.image_score or candidate.image_width * candidate.image_height,
            ),
        )
        if candidates
        else None
    )


def meta_content(soup, key: str) -> str:
    tag = soup.find("meta", attrs={"property": key}) or soup.find("meta", attrs={"name": key})
    return clean_text(tag.get("content", "")) if tag else ""


def split_bandcamp_title(value: str) -> tuple[str, str]:
    if ", by " in value:
        title, artist = value.rsplit(", by ", 1)
        return clean_text(title), clean_text(artist)
    return clean_text(value), ""
