import csv
import tempfile
import unittest
from pathlib import Path

from artwork_fetcher.distro_sync import (
    SUPPORTED_FORMATS,
    ManifestItem,
    ResearchedMetadata,
    default_summary,
    distro_slug,
    parse_bandcamp_release_date,
    sync_manifest,
)


class DistroSyncTests(unittest.TestCase):
    def test_distro_slug_preserves_plain_english_spellings(self):
        item = ManifestItem("006", "Dead Elephant", "Heavy Huge and Rotten", "CD", "downloaded", "")

        self.assertEqual(distro_slug(item, SUPPORTED_FORMATS["CD"]), "dead-elephant-heavy-huge-and-rotten-cd")

    def test_bandcamp_release_date_parsing(self):
        self.assertEqual(parse_bandcamp_release_date("Album by Artist, released 20 October 2017"), "2017-10-20")
        self.assertEqual(parse_bandcamp_release_date("Album by Artist, released 20 October 2017 1. Intro"), "2017-10-20")

    def test_default_summary_uses_researched_metadata(self):
        item = ManifestItem("001", "Artist", "Album", "CD", "downloaded", "")

        self.assertEqual(
            default_summary(item, SUPPORTED_FORMATS["CD"], ResearchedMetadata("2017-10-20", 9)),
            "CD edition of Album by Artist. Source metadata identifies it as a 9-track release, released October 20, 2017.",
        )

    def test_default_summary_uses_an_before_eleven_track_release(self):
        item = ManifestItem("001", "Artist", "Album", "Tape", "downloaded", "")

        self.assertIn(
            "Source metadata identifies it as an 11-track release",
            default_summary(item, SUPPORTED_FORMATS["Tape"], ResearchedMetadata(track_count=11)),
        )

    def test_dry_run_does_not_write_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = write_manifest(root)
            mockup = write_mockup(root, "001 - Artist - Album [CD] - cover-cd-front-mockup.jpg")
            content_dir = root / "content"

            result = sync_manifest(manifest, content_dir=content_dir, mockups_root=mockup.parent, formats={"CD"})

            self.assertFalse(result.applied)
            self.assertEqual(result.count("create"), 1)
            self.assertFalse((content_dir / "artist-album-cd.json").exists())
            self.assertFalse((content_dir / "artist-album-cd.jpg").exists())

    def test_apply_creates_distro_json_and_copies_mockup(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = write_manifest(root)
            mockup = write_mockup(root, "001 - Artist - Album [CD] - cover-cd-front-mockup.jpg")
            content_dir = root / "content"

            result = sync_manifest(manifest, content_dir=content_dir, mockups_root=mockup.parent, formats={"CD"}, apply=True)

            self.assertTrue(result.applied)
            self.assertEqual(result.count("create"), 1)
            created = (content_dir / "artist-album-cd.json").read_text(encoding="utf-8")
            self.assertIn('"$schema": "../../../.astro/collections/distro.schema.json"', created)
            self.assertIn('"group": "CDs"', created)
            self.assertEqual((content_dir / "artist-album-cd.jpg").read_bytes(), b"mockup")

    def test_apply_creates_tape_distro_entry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = write_manifest(root, normalized_format="Tape")
            mockup = write_mockup(
                root,
                "001 - Artist - Album [Tape] - cover-cassette-front-mockup.jpg",
                mockup_dir="cassette-front",
            )
            content_dir = root / "content"

            result = sync_manifest(manifest, content_dir=content_dir, mockups_root=mockup.parent, formats={"Tape"}, apply=True)

            self.assertTrue(result.applied)
            created = (content_dir / "artist-album-cassette.json").read_text(encoding="utf-8")
            self.assertIn('"group": "Tapes"', created)
            self.assertIn('"format": "Cassette"', created)
            self.assertIn('"image_alt": "Album cassette case artwork mockup"', created)
            self.assertIn(
                "Cassette case artwork mockup. Actual cassette shell and labels may vary.",
                created,
            )
            self.assertEqual((content_dir / "artist-album-cassette.jpg").read_bytes(), b"mockup")

    def test_apply_updates_existing_duplicate_key_instead_of_creating_second_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = write_manifest(root)
            mockup = write_mockup(root, "001 - Artist - Album [CD] - cover-cd-front-mockup.jpg")
            content_dir = root / "content"
            content_dir.mkdir()
            (content_dir / "album-cd.json").write_text(
                """{
  "$schema": "../../../.astro/collections/distro.schema.json",
  "title": "Album",
  "group": "CDs",
  "artist_or_label": "Artist",
  "image": "old.jpg",
  "image_alt": "Old image",
  "summary": "Human-written summary.",
  "format": "CD",
  "order": 7
}
""",
                encoding="utf-8",
            )

            result = sync_manifest(manifest, content_dir=content_dir, mockups_root=mockup.parent, formats={"CD"}, apply=True)

            self.assertEqual(result.count("update"), 1)
            self.assertEqual(len(list(content_dir.glob("*.json"))), 1)
            updated = (content_dir / "album-cd.json").read_text(encoding="utf-8")
            self.assertIn('"summary": "Human-written summary."', updated)
            self.assertIn('"order": 7', updated)
            self.assertIn('"image": "album-cd.jpg"', updated)

    def test_existing_duplicate_entries_stop_the_plan(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = write_manifest(root)
            mockup = write_mockup(root, "001 - Artist - Album [CD] - cover-cd-front-mockup.jpg")
            content_dir = root / "content"
            content_dir.mkdir()
            for name in ("one.json", "two.json"):
                (content_dir / name).write_text(
                    """{
  "title": "Album",
  "group": "CDs",
  "artist_or_label": "Artist",
  "image": "image.jpg",
  "image_alt": "Image",
  "summary": "Summary.",
  "format": "CD",
  "order": 1
}
""",
                    encoding="utf-8",
                )

            result = sync_manifest(manifest, content_dir=content_dir, mockups_root=mockup.parent, formats={"CD"}, apply=True)

            self.assertFalse(result.applied)
            self.assertIn("Existing distro duplicate", result.errors[0])

    def test_update_adds_missing_schema_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = write_manifest(root)
            mockup = write_mockup(root, "001 - Artist - Album [CD] - cover-cd-front-mockup.jpg")
            content_dir = root / "content"
            content_dir.mkdir()
            (content_dir / "album-cd.json").write_text(
                """{
  "title": "Album",
  "group": "CDs",
  "artist_or_label": "Artist",
  "image": "old.jpg",
  "image_alt": "Old image",
  "summary": "Human-written summary.",
  "format": "CD",
  "order": 7
}
""",
                encoding="utf-8",
            )

            sync_manifest(manifest, content_dir=content_dir, mockups_root=mockup.parent, formats={"CD"}, apply=True)

            updated = (content_dir / "album-cd.json").read_text(encoding="utf-8")
            self.assertIn('"$schema": "../../../.astro/collections/distro.schema.json"', updated)


def write_manifest(root: Path, normalized_format: str = "CD") -> Path:
    images = root / "images"
    images.mkdir()
    cover = images / f"001 - Artist - Album [{normalized_format}] - cover.jpg"
    cover.write_bytes(b"cover")
    manifest = root / "manifest.csv"
    with manifest.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["row_number", "normalized_artist", "normalized_title", "normalized_format", "status", "local_path"],
        )
        writer.writeheader()
        writer.writerow(
            {
                "row_number": "001",
                "normalized_artist": "Artist",
                "normalized_title": "Album",
                "normalized_format": normalized_format,
                "status": "downloaded",
                "local_path": str(cover),
            }
        )
    return manifest


def write_mockup(root: Path, name: str, mockup_dir: str = "cd-front-concrete") -> Path:
    mockups = root / "mockups" / mockup_dir
    mockups.mkdir(parents=True)
    mockup = mockups / name
    mockup.write_bytes(b"mockup")
    return mockup


if __name__ == "__main__":
    unittest.main()
