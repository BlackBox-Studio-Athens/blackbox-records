import tempfile
import unittest
from pathlib import Path

from artwork_fetcher.files import safe_filename, safe_filename_component
from artwork_fetcher.text import normalize_release


class FilenameTests(unittest.TestCase):
    def test_filename_sanitization_preserves_greek(self):
        self.assertEqual(safe_filename_component('Ατοπια / bad:name* '), "Ατοπια _ bad_name_")

    def test_safe_filename_pattern(self):
        with tempfile.TemporaryDirectory() as tmp:
            release = normalize_release(24, "We lost the Sea", "Departure Songs", "Vinyl 12''")
            path = safe_filename(release, "image/jpeg", Path(tmp))
            self.assertEqual(path.name, "024 - We lost the Sea - Departure Songs [Vinyl 12in] - cover.jpg")

    def test_collision_suffix(self):
        with tempfile.TemporaryDirectory() as tmp:
            release = normalize_release(1, "A", "B", "CD")
            first = safe_filename(release, "image/png", Path(tmp))
            first.write_bytes(b"x")
            second = safe_filename(release, "image/png", Path(tmp))
            self.assertEqual(second.name, "001 - A - B [CD] - cover - 2.png")


if __name__ == "__main__":
    unittest.main()
