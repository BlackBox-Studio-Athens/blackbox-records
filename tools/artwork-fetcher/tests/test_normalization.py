import tempfile
import unittest
from pathlib import Path

from artwork_fetcher.text import clean_text, names_match, normalize_format, normalize_release, parse_input, score_confidence, select_releases
from artwork_fetcher.sources import split_bandcamp_title


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
        self.assertEqual(confidence, "low")

    def test_bandcamp_title_split(self):
        self.assertEqual(split_bandcamp_title("Departure Songs, by We Lost the Sea"), ("Departure Songs", "We Lost the Sea"))

    def test_loose_bandcamp_matching(self):
        self.assertTrue(names_match("Hey Stealthy", "Hay Stealthy"))
        self.assertTrue(names_match("The big fish", "Big Fish"))
        self.assertTrue(names_match("Sadhus", "Sadhus, The Smoking Community"))


if __name__ == "__main__":
    unittest.main()
