import tempfile
import unittest
from pathlib import Path

from PIL import Image

from artwork_fetcher.files import hamming_distance, image_average_hash, safe_filename
from artwork_fetcher.models import Candidate
from artwork_fetcher.net import retry_after_seconds
from artwork_fetcher.runner import THUMBNAIL_MATCH_SCORE, apply_independent_metadata_agreement, apply_thumbnail_agreement, ArtworkFetcher, should_query_youtube
from artwork_fetcher.text import normalize_release


class FakeResponse:
    def __init__(self, retry_after: str):
        self.headers = {"Retry-After": retry_after}


class FakeHttp:
    def __init__(self, images: dict[str, bytes]):
        self.images = images
        self.requests: list[str] = []

    def image(self, url: str) -> tuple[bytes, str]:
        self.requests.append(url)
        return self.images[url], "image/png"


def sample_image(left: tuple[int, int, int], right: tuple[int, int, int]) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "sample.png"
        image = Image.new("RGB", (16, 16), left)
        for x in range(8, 16):
            for y in range(16):
                image.putpixel((x, y), right)
        image.save(path)
        return path.read_bytes()


class ImageTests(unittest.TestCase):
    def test_average_hash_matches_same_thumbnail(self):
        first = image_average_hash(sample_image((0, 0, 0), (255, 255, 255)))
        second = image_average_hash(sample_image((0, 0, 0), (255, 255, 255)))
        self.assertEqual(hamming_distance(first, second), 0)

    def test_thumbnail_agreement_boosts_matching_candidates(self):
        image = sample_image((0, 0, 0), (255, 255, 255))
        http = FakeHttp({"a": image, "b": image})
        first = Candidate(source="MusicBrainz/Cover Art Archive", confidence="medium", score=100, image_url="full-a", thumbnail_url="a")
        second = Candidate(source="Discogs", confidence="high", score=100, image_url="full-b", thumbnail_url="b")

        apply_thumbnail_agreement([first, second], http)

        self.assertEqual(first.score, 100 + THUMBNAIL_MATCH_SCORE)
        self.assertEqual(second.score, 100 + THUMBNAIL_MATCH_SCORE)
        self.assertEqual(first.confidence, "high")
        self.assertEqual(http.requests, ["a", "b"])
        self.assertIn("thumbnail matches Discogs", first.notes)

    def test_thumbnail_agreement_skips_full_image_urls(self):
        http = FakeHttp({})
        candidate = Candidate(source="Bandcamp", confidence="high", score=100, image_url="full-only")

        apply_thumbnail_agreement([candidate], http)

        self.assertEqual(http.requests, [])

    def test_retry_after_delta_seconds(self):
        self.assertEqual(retry_after_seconds(FakeResponse("7")), 7)

    def test_fetch_release_dry_run_does_not_fetch_thumbnails(self):
        with tempfile.TemporaryDirectory() as tmp:
            fetcher = ArtworkFetcher(Path(tmp), "test@example.com")
            fetcher.prepare()
            fetcher.http.image = lambda _: self.fail("dry-run must not fetch image bytes")
            fetcher.artwork_overrides = {}
            release = normalize_release(1, "Artist", "Title", "CD")

            import artwork_fetcher.runner as runner

            original_bandcamp = runner.bandcamp
            original_musicbrainz = runner.musicbrainz
            original_discogs = runner.discogs
            try:
                runner.bandcamp = lambda *_: Candidate(
                    source="Bandcamp", confidence="high", score=100, image_url="full", thumbnail_url="thumb"
                )
                runner.musicbrainz = lambda *_: None
                runner.discogs = lambda *_: None

                result = fetcher.fetch_release(release, dry_run=True)
            finally:
                runner.bandcamp = original_bandcamp
                runner.musicbrainz = original_musicbrainz
                runner.discogs = original_discogs

            self.assertEqual(result.status, "dry-run")

    def test_independent_metadata_agreement_promotes_image_candidate(self):
        bandcamp = Candidate(source="Bandcamp", confidence="medium", score=100, image_url="full-a")
        musicbrainz = Candidate(source="MusicBrainz/Cover Art Archive", confidence="high", score=100)

        apply_independent_metadata_agreement([bandcamp, musicbrainz])

        self.assertEqual(bandcamp.confidence, "high")
        self.assertIn("independent metadata agreement", bandcamp.notes)

    def test_youtube_query_skipped_when_high_image_candidate_exists(self):
        self.assertFalse(should_query_youtube([Candidate(source="Discogs", confidence="high", score=100, image_url="cover.jpg")]))
        self.assertTrue(should_query_youtube([Candidate(source="Bandcamp", confidence="medium", score=100, image_url="cover.jpg")]))

    def test_download_image_requires_force_for_collision_suffix(self):
        with tempfile.TemporaryDirectory() as tmp:
            fetcher = ArtworkFetcher(Path(tmp), "test@example.com")
            fetcher.prepare()
            release = normalize_release(1, "Artist", "Title", "CD")
            safe_filename(release, "image/png", fetcher.images_dir).write_bytes(b"existing")
            image = sample_image((0, 0, 0), (255, 255, 255))
            fetcher.http.image = lambda _: (image, "image/png")
            candidate = Candidate(source="Manual override", confidence="high", score=100, image_url="https://example.com/cover.png")

            with self.assertRaisesRegex(RuntimeError, "file exists"):
                fetcher.download_image(release, candidate, force=False)

            result = fetcher.download_image(release, candidate, force=True)
            self.assertTrue(result.local_path.endswith("001 - Artist - Title [CD] - cover - 2.png"))

    def test_known_missing_override_skips_provider_queries(self):
        with tempfile.TemporaryDirectory() as tmp:
            fetcher = ArtworkFetcher(
                Path(tmp),
                "test@example.com",
                {
                    "The Vagina lips\tRandom Tapes": {
                        "url": "https://www.discogs.com/release/8497993-The-Vagina-Lips-The-Vagina-Lips",
                        "missing": True,
                    }
                },
            )
            fetcher.prepare()
            release = normalize_release(1, "The Vagina lips", "Random Tapes", "Tape")

            import artwork_fetcher.runner as runner

            original_bandcamp = runner.bandcamp
            original_musicbrainz = runner.musicbrainz
            original_discogs = runner.discogs
            try:
                runner.bandcamp = lambda *_: self.fail("known missing should skip Bandcamp")
                runner.musicbrainz = lambda *_: self.fail("known missing should skip MusicBrainz")
                runner.discogs = lambda *_: self.fail("known missing should skip Discogs")

                result = fetcher.fetch_release(release)
            finally:
                runner.bandcamp = original_bandcamp
                runner.musicbrainz = original_musicbrainz
                runner.discogs = original_discogs

            self.assertEqual(result.status, "missing")
            self.assertEqual(result.source, "Known missing")
            self.assertIn("known missing artwork", result.notes)


if __name__ == "__main__":
    unittest.main()
