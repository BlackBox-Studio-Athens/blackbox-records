import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

from artwork_fetcher.cd_mockup import CANVAS_SIZE, batch, render_cd_front_mockup


class CdMockupTests(unittest.TestCase):
    def test_render_cd_front_mockup(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cover = root / "cover.png"
            out = root / "mockup.jpg"
            background = root / "background.jpg"
            assets = make_assets(root)
            Image.new("RGB", (800, 1000), (20, 180, 180)).save(cover)
            Image.new("RGB", (400, 400), (80, 80, 76)).save(background)

            render_cd_front_mockup(cover, out, background_path=background, asset_paths=assets)

            with Image.open(out) as image:
                self.assertEqual(image.size, CANVAS_SIZE)

    def test_batch_outputs_cd_front_mockups(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "covers"
            out_dir = Path(tmp) / "mockups"
            background = Path(tmp) / "background.jpg"
            assets = make_assets(Path(tmp))
            source.mkdir()
            Image.new("RGB", (500, 500), (10, 120, 220)).save(source / "a.jpg")
            Image.new("RGB", (400, 400), (80, 80, 76)).save(background)

            with self.subTest("suffix"):
                self.assertEqual(
                    [path.name for path in batch(source, out_dir, background_path=background, asset_paths=assets)],
                    ["a-cd-front-mockup.jpg"],
                )


def make_assets(root: Path) -> dict[str, Path]:
    paths = {name: root / f"{name}.png" for name in ("box", "mask", "overlay")}
    Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0)).save(paths["mask"])
    mask = Image.open(paths["mask"]).convert("RGBA")
    ImageDraw.Draw(mask).rectangle((900, 500, 2050, 1650), fill=(255, 255, 255, 255))
    mask.save(paths["mask"])

    box = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    ImageDraw.Draw(box).rectangle((840, 460, 2120, 1710), outline=(230, 230, 220, 180), width=24)
    box.save(paths["box"])

    overlay = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    ImageDraw.Draw(overlay).line((1000, 540, 1900, 1540), fill=(255, 255, 255, 80), width=8)
    overlay.save(paths["overlay"])
    return paths


if __name__ == "__main__":
    unittest.main()
