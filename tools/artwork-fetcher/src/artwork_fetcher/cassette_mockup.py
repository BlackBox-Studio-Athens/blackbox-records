from __future__ import annotations

import argparse
import csv
import json
import subprocess
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

from .mockup import SAFE_SUFFIXES, crop_to_fill, download_asset
from .net import Http
from .sources import bandcamp_cassette_product_image_urls, is_bandcamp_url
from .text import clean_text


CANVAS_SIZE = (1600, 2000)
PSD_TO_OUTPUT_SCALE = 0.602
PSD_CROP_ORIGIN = (232, -26)
J_CARD_POSITION = (789, 736)
J_CARD_SIZE = (1240, 1977)
SUFFIX = "cassette-front-mockup.jpg"

PIXPINE_SOURCE = "https://pixpine.com/product/free-cassette-tape-mockup/"
DEFAULT_PIXPINE_PSD = Path(r"D:\Downloads\free-cassette-tape-mockup\Free Cassette Tap Mockup.psd")
DEFAULT_OVERRIDES = Path(__file__).resolve().parents[2] / "cassette_mockup_overrides.json"
ASPHALT023S_SOURCE = "https://ambientcg.com/view?id=Asphalt023S"
ASPHALT023S_BACKGROUND_URL = "https://f003.backblazeb2.com/file/ambientCG-Web/media/surface-preview/Asphalt023S/Asphalt023S_SQ_Color.jpg"
DISCLOSURE = "Cassette case artwork mockup. Actual cassette shell and labels may vary."

CASE_SHADOW_LAYER = 3
CASE_OVERLAY_LAYERS = (4, 5, 6, 7, 8, 12)
CASE_LAYER_OFFSETS = {
    3: (739, 350),
    4: (763, 679),
    5: (763, 679),
    6: (763, 679),
    7: (763, 679),
    8: (769, 685),
    12: (749, 704),
}
CASE_LAYERS = (CASE_SHADOW_LAYER, *CASE_OVERLAY_LAYERS)


def render_cassette_front_mockup(
    cover_path: Path,
    out_path: Path,
    cache_dir: Path | None = None,
    psd_path: Path | None = None,
    background_path: Path | None = None,
    layer_paths: dict[int, Path] | None = None,
) -> None:
    cache_dir = cache_dir or out_path.parent / "_source-cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    background = build_background(background_path or download_background(cache_dir))
    layers = load_case_layers(cache_dir, psd_path or DEFAULT_PIXPINE_PSD, layer_paths)
    j_card = load_j_card(cover_path)

    background.alpha_composite(scale_layer(layers[CASE_SHADOW_LAYER]), output_position(CASE_LAYER_OFFSETS[CASE_SHADOW_LAYER]))
    background.alpha_composite(scale_layer(j_card), output_position(J_CARD_POSITION))
    for layer_index in CASE_OVERLAY_LAYERS:
        background.alpha_composite(scale_layer(layers[layer_index]), output_position(CASE_LAYER_OFFSETS[layer_index]))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    background.convert("RGB").save(out_path, quality=94, subsampling=1)


def batch(
    input_dir: Path,
    out_dir: Path,
    cache_dir: Path | None = None,
    psd_path: Path | None = None,
    background_path: Path | None = None,
    layer_paths: dict[int, Path] | None = None,
) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    cache = cache_dir or out_dir / "_source-cache"
    outputs = []
    for cover in sorted(path for path in input_dir.iterdir() if path.suffix.lower() in SAFE_SUFFIXES):
        out = out_dir / f"{cover.stem}-{SUFFIX}"
        render_cassette_front_mockup(cover, out, cache, psd_path, background_path, layer_paths)
        outputs.append(out)
    return outputs


def render_manifest(
    manifest_path: Path,
    out_dir: Path,
    cache_dir: Path | None = None,
    psd_path: Path | None = None,
    background_path: Path | None = None,
    overrides_path: Path | None = DEFAULT_OVERRIDES,
    discover_bandcamp_references: bool = False,
    layer_paths: dict[int, Path] | None = None,
) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    cache = cache_dir or out_dir / "_source-cache"
    overrides = load_overrides(overrides_path)
    outputs: list[Path] = []
    for row in read_tape_manifest_rows(manifest_path):
        cover = resolve_manifest_path(clean_text(row.get("local_path", "")), manifest_path)
        if not cover.exists():
            continue
        reference_dir = manifest_path.parent / "cassette-reference" / slug_like(f"{row['normalized_artist']} {row['normalized_title']}")
        if discover_bandcamp_references and is_bandcamp_url(clean_text(row.get("source_page_url", ""))):
            download_bandcamp_cassette_references(clean_text(row.get("source_page_url", "")), reference_dir, cache)
        j_card = prepare_j_card_source(cover, row, reference_dir, overrides)
        out = manifest_output_path(row, cover, out_dir)
        render_cassette_front_mockup(j_card, out, cache, psd_path, background_path, layer_paths)
        outputs.append(out)
    return outputs


def read_tape_manifest_rows(manifest_path: Path) -> list[dict[str, str]]:
    with manifest_path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    return [
        row
        for row in rows
        if clean_text(row.get("status", "")) == "downloaded" and clean_text(row.get("normalized_format") or row.get("format", "")) == "Tape"
    ]


def prepare_j_card_source(cover_path: Path, row: dict[str, str], reference_dir: Path, overrides: dict[str, dict]) -> Path:
    override = overrides.get(override_key(row))
    if not override:
        return cover_path
    source = override_image_source(override, reference_dir)
    crop = override.get("jcard_crop_xywh")
    if not source or not crop:
        return source or cover_path
    x, y, width, height = [int(value) for value in crop]
    reference_dir.mkdir(parents=True, exist_ok=True)
    out = reference_dir / f"{slug_like(override_key(row))}-jcard-crop.jpg"
    with Image.open(source) as image:
        image.crop((x, y, x + width, y + height)).convert("RGB").save(out, quality=94)
    return out


def override_image_source(override: dict, reference_dir: Path) -> Path | None:
    path = clean_text(str(override.get("jcard_path", "")))
    if path:
        return Path(path)
    url = clean_text(str(override.get("jcard_image_url", "")))
    if not url:
        return None
    reference_dir.mkdir(parents=True, exist_ok=True)
    return download_asset(url, reference_dir / Path(urlparse(url).path).name)


def download_bandcamp_cassette_references(page_url: str, reference_dir: Path, cache_dir: Path) -> list[Path]:
    html = Http(cache_dir, "BlackBox Records mockup renderer").text(page_url)
    urls = bandcamp_cassette_product_image_urls(html)
    reference_dir.mkdir(parents=True, exist_ok=True)
    return [download_asset(url, reference_dir / Path(urlparse(url).path).name) for url in urls]


def load_overrides(path: Path | None) -> dict[str, dict]:
    if not path or not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    overrides = {key: value.copy() for key, value in data.items() if isinstance(value, dict)} if isinstance(data, dict) else {}
    for override in overrides.values():
        jcard_path = clean_text(str(override.get("jcard_path", "")))
        if jcard_path and not Path(jcard_path).is_absolute():
            override["jcard_path"] = str(path.parent / jcard_path)
    return overrides


def manifest_output_path(row: dict[str, str], cover: Path, out_dir: Path) -> Path:
    output_name = clean_text(row.get("output_name", ""))
    if not output_name:
        return out_dir / f"{cover.stem}-{SUFFIX}"
    if Path(output_name).name != output_name or Path(output_name).suffix.lower() not in SAFE_SUFFIXES:
        raise ValueError(f"Invalid manifest output_name: {output_name}")
    return out_dir / output_name


def resolve_manifest_path(path_text: str, manifest_path: Path) -> Path:
    path = Path(path_text)
    if path.is_absolute():
        return path
    for candidate in (Path.cwd() / path, manifest_path.parent / path, manifest_path.parent.parent / path):
        if candidate.exists():
            return candidate
    return manifest_path.parent / path


def override_key(row: dict[str, str]) -> str:
    return f"{clean_text(row.get('normalized_artist', ''))}\t{clean_text(row.get('normalized_title', ''))}"


def slug_like(value: str) -> str:
    value = value.lower().replace("\t", "-")
    return "".join(char if char.isalnum() else "-" for char in value).strip("-")


def load_case_layers(
    cache_dir: Path,
    psd_path: Path,
    layer_paths: dict[int, Path] | None = None,
) -> dict[int, Image.Image]:
    paths = layer_paths or export_case_layers(psd_path, cache_dir / "pixpine-cassette-case-layers")
    return {index: Image.open(paths[index]).convert("RGBA") for index in CASE_LAYERS}


def export_case_layers(psd_path: Path, out_dir: Path) -> dict[int, Path]:
    if not psd_path.exists():
        raise FileNotFoundError(f"Pixpine PSD not found: {psd_path}")
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = {index: out_dir / f"pixpine-layer-{index:02d}.png" for index in CASE_LAYERS}
    missing = [index for index, path in paths.items() if not path.exists() or not path.stat().st_size]
    for index in missing:
        command = ["magick", f"{psd_path}[{index}]", str(paths[index])]
        result = subprocess.run(command, check=False, capture_output=True, text=True)
        if result.returncode:
            message = (result.stderr or result.stdout or "ImageMagick failed").strip()
            raise RuntimeError(f"Could not export Pixpine PSD layer {index}: {message}") from None
    return paths


def download_background(cache_dir: Path) -> Path:
    return download_asset(ASPHALT023S_BACKGROUND_URL, cache_dir / "ambientcg-asphalt023s.jpg")


def build_background(path: Path) -> Image.Image:
    image = crop_to_fill(Image.open(path).convert("RGB"), CANVAS_SIZE)
    image = ImageOps.grayscale(image).convert("RGBA")
    image = ImageEnhance.Contrast(image).enhance(1.12)
    image = ImageEnhance.Brightness(image).enhance(0.54)

    grade = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(grade)
    draw.rectangle((0, 0, CANVAS_SIZE[0], 860), fill=(0, 0, 0, 30))
    draw.rectangle((0, 1260, CANVAS_SIZE[0], CANVAS_SIZE[1]), fill=(16, 16, 15, 58))
    image.alpha_composite(grade)
    return add_vignette(image)


def add_vignette(image: Image.Image) -> Image.Image:
    small_size = (160, 200)
    layer = Image.new("RGBA", small_size, (0, 0, 0, 0))
    px = layer.load()
    cx, cy = small_size[0] / 2, small_size[1] / 2
    max_distance = (cx**2 + cy**2) ** 0.5
    for y in range(small_size[1]):
        for x in range(small_size[0]):
            distance = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / max_distance
            alpha = max(0, min(92, round((distance - 0.42) * 190)))
            if alpha:
                px[x, y] = (0, 0, 0, alpha)
    layer = layer.filter(ImageFilter.GaussianBlur(7)).resize(CANVAS_SIZE, Image.Resampling.LANCZOS)
    image.alpha_composite(layer)
    return image


def load_j_card(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    contained = ImageOps.contain(image, J_CARD_SIZE, Image.Resampling.LANCZOS)
    matte = Image.new("RGBA", J_CARD_SIZE, (14, 14, 13, 255))
    matte.alpha_composite(contained, ((J_CARD_SIZE[0] - contained.width) // 2, (J_CARD_SIZE[1] - contained.height) // 2))
    return matte


def scale_layer(layer: Image.Image) -> Image.Image:
    size = (round(layer.width * PSD_TO_OUTPUT_SCALE), round(layer.height * PSD_TO_OUTPUT_SCALE))
    return layer.resize(size, Image.Resampling.LANCZOS)


def output_position(position: tuple[int, int]) -> tuple[int, int]:
    x, y = position
    origin_x, origin_y = PSD_CROP_ORIGIN
    return (round((x - origin_x) * PSD_TO_OUTPUT_SCALE), round((y - origin_y) * PSD_TO_OUTPUT_SCALE))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Create Pixpine cassette case/J-card mockups.")
    parser.add_argument("--cover", type=Path, help="Single cover image.")
    parser.add_argument("--input-dir", type=Path, help="Directory of cover images.")
    parser.add_argument("--manifest", type=Path, help="Artwork fetcher manifest.csv; renders downloaded Tape rows.")
    parser.add_argument("--out", type=Path, help="Output image for --cover.")
    parser.add_argument("--out-dir", type=Path, default=Path("./mockups"), help="Output directory.")
    parser.add_argument("--cache-dir", type=Path, help="Shared mockup asset cache.")
    parser.add_argument("--mockup-psd", type=Path, default=DEFAULT_PIXPINE_PSD, help="Pixpine cassette PSD.")
    parser.add_argument("--background", type=Path, help="Override Asphalt 023S background image.")
    parser.add_argument("--overrides", type=Path, default=DEFAULT_OVERRIDES, help="Optional per-release J-card crop overrides.")
    parser.add_argument("--discover-bandcamp-references", action="store_true", help="Download Bandcamp cassette product images next to the manifest.")
    args = parser.parse_args(argv)

    if args.cover:
        out = args.out or args.out_dir / f"{args.cover.stem}-{SUFFIX}"
        render_cassette_front_mockup(args.cover, out, args.cache_dir, args.mockup_psd, args.background)
        print(out)
        return 0
    if args.input_dir:
        for out in batch(args.input_dir, args.out_dir, args.cache_dir, args.mockup_psd, args.background):
            print(out)
        return 0
    if args.manifest:
        for out in render_manifest(
            args.manifest,
            args.out_dir,
            args.cache_dir,
            args.mockup_psd,
            args.background,
            args.overrides,
            args.discover_bandcamp_references,
        ):
            print(out)
        return 0
    parser.error("Provide --cover, --input-dir, or --manifest")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
