import os
import tempfile
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

import artwork_fetcher.sources as sources
from artwork_fetcher.models import Candidate
from artwork_fetcher.text import (
    clean_text,
    names_match,
    normalize_format,
    normalize_release,
    parse_input,
    score_confidence,
    search_variants,
    select_releases,
)
from artwork_fetcher.sources import (
    artwork_override,
    bandcamp_override_candidate,
    best,
    best_cover_art_image,
    best_discogs_image,
    best_youtube_thumbnail,
    cover_art_thumbnail_url,
    discogs_release_candidate,
    discogs_release_id_from_url,
    override_candidate_from_url,
    release_group_cover_art_url,
    split_bandcamp_title,
    without_discogs_noise,
    youtube_artist_title,
    youtube_candidate_from_entry,
    youtube_thumbnail_is_cover_like,
)


class FakeJsonHttp:
    def text(self, url: str, headers: dict[str, str] | None = None) -> str:
        return '<meta property="og:image" content="https://example.com/cover.jpg"><meta property="og:title" content="Title, by Artist">'


class FakeDiscogsHttp:
    def json(self, url: str, headers: dict[str, str] | None = None) -> dict:
        return {
            "uri": "https://www.discogs.com/release/36807715",
            "artists": [{"name": "Nausea Bomb"}],
            "title": "Lutèce Punkabilloi",
            "formats": [{"name": "CD"}],
            "images": [{"type": "primary", "uri": "https://img.discogs.com/cover.jpg", "width": 1200, "height": 1200}],
        }


class NormalizationTests(unittest.TestCase):
    def test_whitespace_cleanup(self):
        self.assertEqual(clean_text("  One   leg Mary \t "), "One leg Mary")

    def test_unicode_preservation(self):
        self.assertEqual(clean_text(" Ατελές   το ον "), "Ατελές το ον")

    def test_format_normalization(self):
        self.assertEqual(normalize_format("CD"), "CD")
        self.assertEqual(normalize_format("Tape"), "Tape")
        self.assertEqual(normalize_format("Vinyl 12''"), "Vinyl 12in")

    def test_csv_and_tsv_parsing(self):
        with tempfile.TemporaryDirectory() as tmp:
            csv_path = Path(tmp) / "releases.csv"
            csv_path.write_text("artist,title,format\nA,B,CD\n", encoding="utf-8")
            tsv_path = Path(tmp) / "releases.tsv"
            tsv_path.write_text("artist\ttitle\tformat\nΑτοπια \tΑτοπια \tCD\n", encoding="utf-8")
            self.assertEqual(parse_input(csv_path)[0].normalized_title, "B")
            self.assertEqual(parse_input(tsv_path)[0].normalized_artist, "Ατοπια")

    def test_limit_three_picks_formats(self):
        releases = [
            normalize_release(1, "A", "CD item", "CD"),
            normalize_release(2, "B", "Tape item", "Tape"),
            normalize_release(3, "C", "Vinyl item", "Vinyl 12''"),
        ]
        self.assertEqual([item.normalized_format for item in select_releases(releases, 3)], ["CD", "Tape", "Vinyl 12in"])

    def test_confidence_scoring(self):
        release = normalize_release(1, "Stefan Clor", "Baltica", "CD")
        score, confidence = score_confidence(release, "Stefan Clor", "Baltica", "CD")
        self.assertGreater(score, 90)
        self.assertEqual(confidence, "high")
        _, confidence = score_confidence(release, "Stefan Clor", "Baltica", "Digital Media")
        self.assertEqual(confidence, "low")
        _, confidence = score_confidence(release, "Stefan Clor", "Other", "CD")
        self.assertEqual(confidence, "none")

    def test_bandcamp_title_split(self):
        self.assertEqual(split_bandcamp_title("Departure Songs, by We Lost the Sea"), ("Departure Songs", "We Lost the Sea"))

    def test_loose_bandcamp_matching(self):
        self.assertTrue(names_match("Hey Stealthy", "Hay Stealthy"))
        self.assertTrue(names_match("The big fish", "Big Fish"))
        self.assertTrue(names_match("Sadhus", "Sadhus, The Smoking Community"))
        self.assertTrue(names_match("Stefan Clor", "Stéphane Clor"))
        self.assertTrue(names_match("Magmarus", "Μάγμαρους"))
        self.assertTrue(names_match("AFLMSMP", "Am Fost La Munte Și Mi-a Plăcut"))

    def test_release_suffix_is_optional_for_album_title_match(self):
        self.assertTrue(names_match("2025 EP", "2025"))
        self.assertIn("2025", search_variants("2025 EP"))

    def test_different_release_suffixes_do_not_match(self):
        self.assertFalse(names_match("2025 EP", "2025 LP"))
        self.assertFalse(names_match("2025 EP", "2025 Single"))

    def test_title_only_match_is_not_enough(self):
        release = normalize_release(1, "Huracan", "2025 EP", "Vinyl 12''")
        _, confidence = score_confidence(release, "Lumber", "2025 EP")
        self.assertEqual(confidence, "none")

    def test_best_prefers_image_candidate(self):
        selected = best(
            [
                Candidate(source="MusicBrainz", confidence="high", score=100),
                Candidate(source="Bandcamp", confidence="medium", score=90, image_url="https://example.com/cover.jpg"),
            ]
        )
        self.assertEqual(selected.source, "Bandcamp")

    def test_best_prefers_higher_resolution_when_match_ties(self):
        selected = best(
            [
                Candidate(source="Small", confidence="high", score=100, image_url="https://example.com/small.jpg", image_width=500, image_height=500),
                Candidate(source="Large", confidence="high", score=100, image_url="https://example.com/large.jpg", image_width=1000, image_height=1000),
            ]
        )
        self.assertEqual(selected.source, "Large")

    def test_cover_art_archive_selects_largest_front_image(self):
        selected = best_cover_art_image(
            [
                {"front": True, "image": "https://example.com/small.jpg", "thumbnails": {"250": "https://example.com/small-250.jpg"}},
                {"front": True, "image": "https://example.com/large.jpg", "thumbnails": {"1200": "https://example.com/large-1200.jpg"}},
            ]
        )
        self.assertEqual(selected["image"], "https://example.com/large.jpg")

    def test_cover_art_thumbnail_does_not_fall_back_to_original(self):
        self.assertEqual(cover_art_thumbnail_url({"image": "https://example.com/full.jpg"}), "")

    def test_discogs_selects_largest_primary_image(self):
        selected = best_discogs_image(
            [
                {"type": "secondary", "uri": "https://example.com/secondary.jpg", "width": 2000, "height": 2000},
                {"type": "primary", "uri": "https://example.com/small.jpg", "width": 500, "height": 500},
                {"type": "primary", "uri": "https://example.com/large.jpg", "width": 1000, "height": 1000},
            ]
        )
        self.assertEqual(selected["uri"], "https://example.com/large.jpg")

    def test_release_group_cover_art_fallback(self):
        previous = sys.modules.get("musicbrainzngs")
        sys.modules["musicbrainzngs"] = SimpleNamespace(
            get_release_group_image_list=lambda _: {"images": [{"front": True, "image": "https://example.com/group.jpg"}]}
        )
        try:
            with tempfile.TemporaryDirectory() as tmp:
                self.assertEqual(release_group_cover_art_url("group-id", Path(tmp)), "https://example.com/group.jpg")
        finally:
            if previous is None:
                sys.modules.pop("musicbrainzngs", None)
            else:
                sys.modules["musicbrainzngs"] = previous

    def test_verified_bandcamp_override_promotes_high(self):
        release = normalize_release(1, "Artist", "Title", "CD")
        candidate = bandcamp_override_candidate(release, FakeJsonHttp(), {"url": "https://artist.bandcamp.com/album/title", "verified": True})
        self.assertEqual(candidate.confidence, "high")
        self.assertIn("verified override", candidate.notes)

    def test_override_can_use_source_page_with_direct_image(self):
        release = normalize_release(1, "Huracan", "2025 EP", "Vinyl 12''")
        candidate = override_candidate_from_url(
            release,
            FakeJsonHttp(),
            "https://huracantheband.bandcamp.com/album/2025",
            True,
            "https://f4.bcbits.com/img/a2531581096_10.jpg",
        )
        self.assertEqual(candidate.confidence, "high")
        self.assertEqual(candidate.source_page_url, "https://huracantheband.bandcamp.com/album/2025")
        self.assertEqual(candidate.image_url, "https://f4.bcbits.com/img/a2531581096_10.jpg")

    def test_known_missing_override_records_manual_dead_end(self):
        release = normalize_release(1, "The Vagina lips", "Random Tapes", "Tape")
        candidate = artwork_override(
            release,
            FakeJsonHttp(),
            {
                "The Vagina lips\tRandom Tapes": {
                    "url": "https://www.discogs.com/release/8497993-The-Vagina-Lips-The-Vagina-Lips",
                    "missing": True,
                    "note": "Discogs mention has no exposed artwork.",
                }
            },
        )
        self.assertEqual(candidate.source, "Known missing")
        self.assertIn("known missing artwork", candidate.notes)

    def test_discogs_release_url_parsing(self):
        self.assertEqual(
            discogs_release_id_from_url("https://www.discogs.com/release/34259821-Maserati-Live-At-Dunk2024"),
            "34259821",
        )

    def test_discogs_search_noise_is_removed(self):
        self.assertEqual(without_discogs_noise("Live at Dunk! Fest 2024"), "Live at Dunk! 2024")

    def test_verified_discogs_override_accepts_manual_title_mismatch(self):
        release = normalize_release(1, "Nausea Bomb", "Slap punkabilly", "CD")
        candidate = discogs_release_candidate(release, FakeDiscogsHttp(), "36807715", "Discogs override URL", verified=True)
        self.assertEqual(candidate.confidence, "high")
        self.assertEqual(candidate.discogs_release_id, "36807715")
        self.assertEqual(candidate.image_url, "https://img.discogs.com/cover.jpg")

    def test_discogs_deduplicates_broadened_search_results(self):
        release = normalize_release(1, "Maserati", "Live at Dunk! Fest 2024", "Vinyl 12''")
        calls = []
        previous_token = os.environ.get("DISCOGS_TOKEN")
        original_searches = sources.discogs_searches
        original_candidate = sources.discogs_release_candidate
        os.environ["DISCOGS_TOKEN"] = "test"
        try:
            sources.discogs_searches = lambda *_: [
                {"results": [{"id": 34259821}, {"id": 1}]},
                {"results": [{"id": 34259821}, {"id": 1}, {"id": 2}]},
            ]

            def fake_candidate(release, http, release_id, note, verified=False):
                calls.append(release_id)
                return Candidate(source="Discogs", confidence="high", score=100, image_url=f"{release_id}.jpg")

            sources.discogs_release_candidate = fake_candidate
            sources.discogs(release, FakeJsonHttp())
        finally:
            sources.discogs_searches = original_searches
            sources.discogs_release_candidate = original_candidate
            if previous_token is None:
                os.environ.pop("DISCOGS_TOKEN", None)
            else:
                os.environ["DISCOGS_TOKEN"] = previous_token

        self.assertEqual(calls, ["34259821", "1", "2"])

    def test_youtube_artist_title_from_dash_title(self):
        release = normalize_release(1, "Artist", "Title", "CD")
        self.assertEqual(
            youtube_artist_title(release, {"title": "Artist - Title (Official Audio)", "channel": "Other"}),
            ("Artist", "Title"),
        )

    def test_youtube_artist_title_from_topic_channel(self):
        release = normalize_release(1, "Artist", "Title", "CD")
        self.assertEqual(
            youtube_artist_title(release, {"title": "Title", "channel": "Artist - Topic"}),
            ("Artist", "Title"),
        )

    def test_youtube_thumbnail_cover_like_filter(self):
        self.assertFalse(youtube_thumbnail_is_cover_like({"width": 1280, "height": 720}))
        self.assertTrue(youtube_thumbnail_is_cover_like({"width": 544, "height": 544}))

    def test_youtube_candidate_uses_square_thumbnail_as_fallback_cover(self):
        release = normalize_release(1, "Artist", "Title", "CD")
        candidate = youtube_candidate_from_entry(
            release,
            {
                "id": "abc123",
                "title": "Artist - Title (Official Audio)",
                "channel": "Artist - Topic",
                "thumbnails": [{"url": "wide.jpg", "width": 1280, "height": 720}, {"url": "cover.jpg", "width": 544, "height": 544}],
            },
        )
        self.assertEqual(candidate.confidence, "medium")
        self.assertEqual(candidate.image_url, "cover.jpg")
        self.assertEqual(candidate.thumbnail_url, "cover.jpg")
        self.assertEqual(candidate.source_page_url, "https://www.youtube.com/watch?v=abc123")

    def test_youtube_candidate_keeps_widescreen_thumbnail_as_evidence_only(self):
        release = normalize_release(1, "Artist", "Title", "CD")
        candidate = youtube_candidate_from_entry(
            release,
            {
                "id": "abc123",
                "title": "Artist - Title (Official Audio)",
                "channel": "Artist - Topic",
                "thumbnails": [{"url": "wide.jpg", "width": 1280, "height": 720}],
            },
        )
        self.assertEqual(candidate.image_url, "")
        self.assertEqual(candidate.thumbnail_url, "wide.jpg")

    def test_best_youtube_thumbnail_chooses_largest(self):
        self.assertEqual(
            best_youtube_thumbnail(
                [{"url": "small.jpg", "width": 120, "height": 90}, {"url": "large.jpg", "width": 544, "height": 544}]
            )["url"],
            "large.jpg",
        )


if __name__ == "__main__":
    unittest.main()
