from __future__ import annotations

import argparse
from pathlib import Path

import requests
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

from .mockup import SAFE_SUFFIXES


CANVAS_SIZE = (2800, 2100)
COVER_SIZE = 1600
COVER_CORNERS = [(1051, 643), (1994, 629), (1996, 1571), (1051, 1550)]
SUFFIX = "cd-front-mockup.jpg"

MOCKUPBRO_SOURCE = "https://mockupbro.com/mockup/front-view-plastic-cd-box"
CONCRETE_SOURCE = "https://ambientcg.com/a/Concrete036"
CONCRETE_BACKGROUND_URL = "https://f003.backblazeb2.com/file/ambientCG-Web/media/surface-preview/Concrete036/Concrete036_SQ_Color.jpg?26158"
MOCKUPBRO_ASSETS = {
    "box": "https://mockupbro.imgix.net/6025510327641-layer3.png?auto=format&w=2800",
    "mask": "https://mockupbro.imgix.net/60255159ae723-layer4-MASK-1600x1600.png?auto=format&w=2800",
    "overlay": "https://mockupbro.imgix.net/6025516eb8657-layer5.png?auto=format&w=2800",
}


def render_cd_front_mockup(
    cover_path: Path,
    out_path: Path,
    cache_dir: Path | None = None,
    background_path: Path | None = None,
    asset_paths: dict[str, Path] | None = None,
) -> None:
    cache_dir = cache_dir or out_path.parent / "_source-cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    assets = load_assets(cache_dir, asset_paths)
    cover = load_cover(cover_path)
    background = build_background(background_path or download(CONCRETE_BACKGROUND_URL, cache_dir / "concrete036-background.jpg"))

    shadow = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse((910, 1488, 2100, 1706), fill=(0, 0, 0, 112))
    background.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(48)))
    background.alpha_composite(assets["box"])
    background.alpha_composite(warp_cover(cover, assets["mask"]))
    background.alpha_composite(assets["overlay"])

    out_path.parent.mkdir(parents=True, exist_ok=True)
    background.convert("RGB").save(out_path, quality=94, subsampling=1)


def batch(
    input_dir: Path,
    out_dir: Path,
    cache_dir: Path | None = None,
    background_path: Path | None = None,
    asset_paths: dict[str, Path] | None = None,
) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    cache = cache_dir or out_dir / "_source-cache"
    outputs = []
    for cover in sorted(path for path in input_dir.iterdir() if path.suffix.lower() in SAFE_SUFFIXES):
        out = out_dir / f"{cover.stem}-{SUFFIX}"
        render_cd_front_mockup(cover, out, cache, background_path, asset_paths)
        outputs.append(out)
    return outputs


def load_assets(cache_dir: Path, asset_paths: dict[str, Path] | None = None) -> dict[str, Image.Image]:
    paths = asset_paths or {name: download(url, cache_dir / f"mockupbro-{name}.png") for name, url in MOCKUPBRO_ASSETS.items()}
    return {name: load_rgba(path) for name, path in paths.items()}


def build_background(path: Path) -> Image.Image:
    image = fit(Image.open(path).convert("RGB"), CANVAS_SIZE)
    image = ImageOps.grayscale(image).convert("RGBA")
    image = ImageEnhance.Contrast(image).enhance(1.12)
    image = ImageEnhance.Brightness(image).enhance(0.50)

    grade = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(grade)
    draw.rectangle((0, 0, CANVAS_SIZE[0], 1180), fill=(0, 0, 0, 54))
    draw.rectangle((0, 1320, CANVAS_SIZE[0], CANVAS_SIZE[1]), fill=(18, 18, 16, 78))
    image.alpha_composite(grade)
    return add_vignette(image)


def warp_cover(cover: Image.Image, mask: Image.Image) -> Image.Image:
    coeffs = perspective_coefficients(COVER_CORNERS, [(0, 0), (COVER_SIZE, 0), (COVER_SIZE, COVER_SIZE), (0, COVER_SIZE)])
    warped = cover.transform(CANVAS_SIZE, Image.Transform.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC)
    alpha = ImageChops.multiply(warped.getchannel("A"), mask.getchannel("A"))
    warped.putalpha(alpha)
    return warped


def perspective_coefficients(destination: list[tuple[int, int]], source: list[tuple[int, int]]) -> list[float]:
    matrix: list[list[float]] = []
    vector: list[float] = []
    for (x, y), (u, v) in zip(destination, source):
        matrix.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        matrix.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        vector.extend([u, v])
    return solve(matrix, vector)


def solve(matrix: list[list[float]], vector: list[float]) -> list[float]:
    n = len(vector)
    rows = [row[:] + [vector[i]] for i, row in enumerate(matrix)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda row: abs(rows[row][col]))
        rows[col], rows[pivot] = rows[pivot], rows[col]
        factor = rows[col][col]
        if abs(factor) < 1e-9:
            raise ValueError("Perspective matrix is singular")
        rows[col] = [value / factor for value in rows[col]]
        for row in range(n):
            if row == col:
                continue
            factor = rows[row][col]
            rows[row] = [value - factor * rows[col][i] for i, value in enumerate(rows[row])]
    return [rows[row][-1] for row in range(n)]


def load_cover(path: Path) -> Image.Image:
    return fit(Image.open(path).convert("RGBA"), (COVER_SIZE, COVER_SIZE))


def load_rgba(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    if image.size != CANVAS_SIZE:
        image = image.resize(CANVAS_SIZE, Image.Resampling.LANCZOS)
    return image


def fit(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def add_vignette(image: Image.Image) -> Image.Image:
    small_size = (280, 210)
    layer = Image.new("RGBA", small_size, (0, 0, 0, 0))
    px = layer.load()
    cx, cy = small_size[0] / 2, small_size[1] / 2
    max_distance = (cx**2 + cy**2) ** 0.5
    for y in range(small_size[1]):
        for x in range(small_size[0]):
            distance = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / max_distance
            alpha = max(0, min(118, round((distance - 0.38) * 220)))
            if alpha:
                px[x, y] = (0, 0, 0, alpha)
    layer = layer.filter(ImageFilter.GaussianBlur(8)).resize(CANVAS_SIZE, Image.Resampling.LANCZOS)
    image.alpha_composite(layer)
    return image


def download(url: str, path: Path) -> Path:
    if path.exists() and path.stat().st_size:
        return path
    response = requests.get(url, headers={"User-Agent": "BlackBox Records mockup renderer"}, timeout=45)
    response.raise_for_status()
    path.write_bytes(response.content)
    return path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Create concrete, front-only CD mockups.")
    parser.add_argument("--cover", type=Path, help="Single cover image.")
    parser.add_argument("--input-dir", type=Path, help="Directory of cover images.")
    parser.add_argument("--out", type=Path, help="Output image for --cover.")
    parser.add_argument("--out-dir", type=Path, default=Path("./mockups"), help="Output directory.")
    parser.add_argument("--cache-dir", type=Path, help="Shared downloaded mockup asset cache.")
    args = parser.parse_args(argv)

    if args.cover:
        out = args.out or args.out_dir / f"{args.cover.stem}-{SUFFIX}"
        render_cd_front_mockup(args.cover, out, args.cache_dir)
        return 0
    if args.input_dir:
        batch(args.input_dir, args.out_dir, args.cache_dir)
        return 0
    parser.error("Provide --cover or --input-dir")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
