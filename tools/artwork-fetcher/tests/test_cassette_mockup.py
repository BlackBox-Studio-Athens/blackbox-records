import tempfile
import unittest
import json
from pathlib import Path

from PIL import Image, ImageDraw

import artwork_fetcher.cassette_mockup as cassette_mockup
from artwork_fetcher.cassette_mockup import (
    CANVAS_SIZE,
    CASE_LAYERS,
    J_CARD_SIZE,
    batch,
    download_bandcamp_cassette_references,
    load_j_card,
    render_cassette_front_mockup,
    render_manifest,
)


class CassetteMockupTests(unittest.TestCase):
    def test_render_cassette_front_mockup(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cover = root / "cover.png"
            out = root / "mockup.jpg"
            background = root / "background.jpg"
            layers = make_layers(root)
            Image.new("RGB", (1000, 1000), (20, 180, 180)).save(cover)
            Image.new("RGB", (400, 400), (80, 80, 76)).save(background)

            render_cassette_front_mockup(cover, out, background_path=background, layer_paths=layers)

            with Image.open(out) as image:
                self.assertEqual(image.size, CANVAS_SIZE)

    def test_batch_outputs_cassette_front_mockups(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "covers"
            out_dir = Path(tmp) / "mockups"
            background = Path(tmp) / "background.jpg"
            layers = make_layers(Path(tmp))
            source.mkdir()
            Image.new("RGB", (500, 500), (10, 120, 220)).save(source / "a.jpg")
            Image.new("RGB", (400, 400), (80, 80, 76)).save(background)

            self.assertEqual(
                [path.name for path in batch(source, out_dir, background_path=background, layer_paths=layers)],
                ["a-cassette-front-mockup.jpg"],
            )

    def test_load_j_card_preserves_full_landscape_artwork(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "landscape.png"
            image = Image.new("RGB", (1200, 600), (220, 20, 20))
            ImageDraw.Draw(image).rectangle((600, 0, 1199, 599), fill=(20, 220, 20))
            image.save(source)

            j_card = load_j_card(source)

            self.assertEqual(j_card.size, J_CARD_SIZE)
            self.assertLess(j_card.getpixel((J_CARD_SIZE[0] // 2, 20))[0], 30)
            self.assertGreater(j_card.getpixel((20, J_CARD_SIZE[1] // 2))[0], 200)
            self.assertGreater(j_card.getpixel((J_CARD_SIZE[0] - 20, J_CARD_SIZE[1] // 2))[1], 200)

    def test_render_manifest_uses_tape_rows_and_crop_overrides(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cover = root / "001 - Artist - Album [Tape] - cover.jpg"
            reference = root / "reference.jpg"
            manifest = root / "manifest.csv"
            out_dir = root / "mockups"
            background = root / "background.jpg"
            overrides = root / "overrides.json"
            Image.new("RGB", (500, 500), (10, 120, 220)).save(cover)
            Image.new("RGB", (600, 400), (220, 20, 20)).save(reference)
            Image.new("RGB", (400, 400), (80, 80, 76)).save(background)
            overrides.write_text(
                json.dumps({"Artist\tAlbum": {"jcard_path": str(reference), "jcard_crop_xywh": [10, 20, 200, 300]}}),
                encoding="utf-8",
            )
            manifest.write_text(
                "row_number,normalized_artist,normalized_title,normalized_format,status,local_path,source_page_url\n"
                f"001,Artist,Album,Tape,downloaded,{cover},https://artist.bandcamp.com/album/album\n"
                f"002,Artist,CD,CD,downloaded,{cover},\n",
                encoding="utf-8",
            )

            outputs = render_manifest(
                manifest,
                out_dir,
                background_path=background,
                overrides_path=overrides,
                layer_paths=make_layers(root),
            )

            self.assertEqual([path.name for path in outputs], ["001 - Artist - Album [Tape] - cover-cassette-front-mockup.jpg"])
            self.assertTrue((root / "cassette-reference" / "artist-album" / "artist-album-jcard-crop.jpg").exists())

    def test_bandcamp_reference_download_uses_shared_http_cache(self):
        class FakeHttp:
            cache_dirs: list[Path] = []

            def __init__(self, cache_dir: Path, user_agent: str):
                self.cache_dirs.append(cache_dir)

            def text(self, url: str) -> str:
                return """<script type="application/ld+json">{
  "@type": ["MusicRelease", "Product"],
  "musicReleaseFormat": "CassetteFormat",
  "image": ["https://f4.bcbits.com/img/0013073977_10.jpg"]
}</script>"""

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            previous_http = cassette_mockup.Http
            previous_download = cassette_mockup.download_asset
            try:
                cassette_mockup.Http = FakeHttp
                cassette_mockup.download_asset = lambda url, path: path

                outputs = download_bandcamp_cassette_references(
                    "https://artist.bandcamp.com/album/album",
                    root / "references",
                    root / "cache",
                )
            finally:
                cassette_mockup.Http = previous_http
                cassette_mockup.download_asset = previous_download

            self.assertEqual(FakeHttp.cache_dirs, [root / "cache"])
            self.assertEqual([path.name for path in outputs], ["0013073977_10.jpg"])


def make_layers(root: Path) -> dict[int, Path]:
    sizes = {
        3: (1745, 2465),
        4: (1337, 2093),
        5: (1337, 2093),
        6: (1337, 2093),
        7: (1337, 2093),
        8: (1331, 2083),
        12: (55, 2025),
    }
    paths = {index: root / f"layer-{index}.png" for index in CASE_LAYERS}
    for index, size in sizes.items():
        image = Image.new("RGBA", size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        if index == 3:
            draw.rectangle((100, 100, size[0] - 120, size[1] - 120), fill=(0, 0, 0, 70))
        elif index == 12:
            draw.line((size[0] // 2, 0, size[0] // 2, size[1]), fill=(255, 255, 255, 130), width=8)
        else:
            draw.rectangle((20, 20, size[0] - 20, size[1] - 20), outline=(235, 235, 225, 140), width=16)
            draw.line((80, 130, size[0] - 120, 320), fill=(255, 255, 255, 60), width=20)
        image.save(paths[index])
    return paths


if __name__ == "__main__":
    unittest.main()
