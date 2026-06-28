import logging
from pathlib import Path

from .files import hamming_distance, image_average_hash, image_dimensions, safe_filename, sha256
from .models import Candidate, FetchResult, Release
from .net import Http
from .sources import artwork_override, bandcamp, best, discogs, musicbrainz, youtube
from .text import append_note

THUMBNAIL_MATCH_DISTANCE = 10
THUMBNAIL_MATCH_SCORE = 15
METADATA_AGREEMENT_SCORE = 10


class ArtworkFetcher:
    def __init__(self, out_dir: Path, user_agent_contact: str, bandcamp_overrides: dict[str, object] | None = None):
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
        override_candidate = artwork_override(release, self.http, self.bandcamp_overrides)
        if override_candidate and override_candidate.source == "Known missing":
            return result_from_candidate(release, override_candidate, "missing", override_candidate.notes)
        candidates = [
            override_candidate,
            bandcamp(release, self.http),
            musicbrainz(release, self.cache_dir, self.contact),
            discogs(release, self.http),
        ]
        if should_query_youtube(candidates):
            candidates.append(youtube(release, self.cache_dir))
        if not dry_run:
            apply_thumbnail_agreement(candidates, self.http)
        apply_independent_metadata_agreement(candidates)
        candidate = best(candidates)
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


def apply_thumbnail_agreement(candidates: list[Candidate | None], http: Http) -> None:
    hashes = []
    for candidate in candidates:
        if not candidate or candidate.confidence == "none":
            continue
        if not candidate.thumbnail_url:
            continue
        try:
            image_bytes, mime_type = http.image(candidate.thumbnail_url)
            if mime_type.startswith("image/"):
                hashes.append((candidate, image_average_hash(image_bytes)))
        except Exception as exc:  # noqa: BLE001
            candidate.notes = append_note(candidate.notes, f"thumbnail comparison skipped: {exc}")
    for index, (candidate, left_hash) in enumerate(hashes):
        for other, right_hash in hashes[index + 1 :]:
            if candidate.source == other.source:
                continue
            if hamming_distance(left_hash, right_hash) <= THUMBNAIL_MATCH_DISTANCE:
                candidate.score += THUMBNAIL_MATCH_SCORE
                other.score += THUMBNAIL_MATCH_SCORE
                candidate.notes = append_note(candidate.notes, f"thumbnail matches {other.source}")
                other.notes = append_note(other.notes, f"thumbnail matches {candidate.source}")
                promote_candidate(candidate, "thumbnail agreement")
                promote_candidate(other, "thumbnail agreement")


def should_query_youtube(candidates: list[Candidate | None]) -> bool:
    return not any(candidate and candidate.confidence == "high" and candidate.image_url for candidate in candidates)


def apply_independent_metadata_agreement(candidates: list[Candidate | None]) -> None:
    agreed = [candidate for candidate in candidates if candidate and candidate.confidence in {"medium", "high"}]
    for candidate in agreed:
        if not candidate.image_url:
            continue
        other_sources = sorted({other.source for other in agreed if other.source != candidate.source})
        if other_sources:
            candidate.score += METADATA_AGREEMENT_SCORE
            promote_candidate(candidate, f"independent metadata agreement with {', '.join(other_sources)}")


def promote_candidate(candidate: Candidate, reason: str) -> None:
    if candidate.confidence == "medium":
        candidate.confidence = "high"
        candidate.notes = append_note(candidate.notes, f"confidence promoted by {reason}")


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
