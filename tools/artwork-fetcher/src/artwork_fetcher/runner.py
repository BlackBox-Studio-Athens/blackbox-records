import logging
from pathlib import Path

from .files import image_dimensions, safe_filename, sha256
from .models import Candidate, FetchResult, Release
from .net import Http
from .sources import bandcamp, best, discogs, musicbrainz
from .text import append_note


class ArtworkFetcher:
    def __init__(self, out_dir: Path, user_agent_contact: str, bandcamp_overrides: dict[str, str] | None = None):
        self.out_dir = out_dir
        self.images_dir = out_dir / "images"
        self.cache_dir = out_dir / ".cache"
        self.contact = user_agent_contact
        self.user_agent = f"release-artwork-fetcher/1.0 (local personal catalog; contact: {user_agent_contact})"
        self.http = Http(self.cache_dir, self.user_agent)
        self.bandcamp_overrides = bandcamp_overrides or {}

    def prepare(self) -> None:
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def fetch_release(self, release: Release, force: bool = False, dry_run: bool = False) -> FetchResult:
        candidate = best(
            [
                bandcamp(release, self.http, self.bandcamp_overrides),
                musicbrainz(release, self.cache_dir, self.contact),
                discogs(release, self.user_agent),
            ]
        )
        if not candidate:
            return result_from_candidate(release, None, "missing", "No high-confidence metadata source found")
        if dry_run:
            return result_from_candidate(release, candidate, "dry-run")
        if not candidate.image_url:
            return result_from_candidate(release, candidate, "missing", candidate.notes or "Selected candidate has no image URL")
        try:
            return self.download_image(release, candidate, force)
        except Exception as exc:  # noqa: BLE001
            logging.exception("Failed %s - %s", release.normalized_artist, release.normalized_title)
            return result_from_candidate(release, candidate, "missing", append_note(candidate.notes, f"download failed: {exc}"))

    def download_image(self, release: Release, candidate: Candidate, force: bool) -> FetchResult:
        image_bytes, mime_type = self.http.image(candidate.image_url)
        if not mime_type.startswith("image/"):
            raise RuntimeError(f"not an image: {mime_type}")
        width, height = image_dimensions(image_bytes)
        local_path = safe_filename(release, mime_type, self.images_dir)
        if local_path.exists() and not force:
            raise RuntimeError(f"file exists: {local_path}")
        local_path.write_bytes(image_bytes)
        confidence = candidate.confidence
        notes = candidate.notes
        if width and height and (width < 300 or height < 300):
            confidence = "low"
            notes = append_note(notes, "Accepted small image below 300x300")
        return FetchResult(
            release=release,
            status="downloaded",
            confidence=confidence,
            source=candidate.source,
            source_page_url=candidate.source_page_url,
            image_url=candidate.image_url,
            local_path=str(local_path),
            mime_type=mime_type,
            width=width,
            height=height,
            sha256=sha256(image_bytes),
            matched_artist=candidate.matched_artist,
            matched_title=candidate.matched_title,
            matched_format=candidate.matched_format,
            mbid=candidate.mbid,
            discogs_release_id=candidate.discogs_release_id,
            notes=notes,
        )


def result_from_candidate(release: Release, candidate: Candidate | None, status: str, notes: str | None = None) -> FetchResult:
    candidate = candidate or Candidate(source="", confidence="none", score=0)
    return FetchResult(
        release=release,
        status=status,
        confidence="none" if status == "missing" else candidate.confidence,
        source=candidate.source,
        source_page_url=candidate.source_page_url,
        image_url=candidate.image_url,
        matched_artist=candidate.matched_artist,
        matched_title=candidate.matched_title,
        matched_format=candidate.matched_format,
        mbid=candidate.mbid,
        discogs_release_id=candidate.discogs_release_id,
        notes=candidate.notes if notes is None else notes,
    )
