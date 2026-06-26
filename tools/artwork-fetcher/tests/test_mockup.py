import tempfile
import unittest
from pathlib import Path

from PIL import Image

from artwork_fetcher.mockup import CANVAS_SIZE, batch, render_vinyl_mockup


class MockupTests(unittest.TestCase):
    def test_render_vinyl_mockup(self):
        with tempfile.TemporaryDirectory() as tmp:
            cover = Path(tmp) / "cover.png"
            out = Path(tmp) / "mockup.webp"
            Image.new("RGB", (800, 1000), (220, 20, 80)).save(cover)
            render_vinyl_mockup(cover, out)
            with Image.open(out) as image:
                self.assertEqual(image.size, CANVAS_SIZE)

    def test_batch_outputs_images(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "covers"
            out_dir = Path(tmp) / "mockups"
            source.mkdir()
            Image.new("RGB", (500, 500), (10, 120, 220)).save(source / "a.jpg")
            self.assertEqual([path.name for path in batch(source, out_dir)], ["a-vinyl-mockup.webp"])


if __name__ == "__main__":
    unittest.main()
