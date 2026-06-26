import argparse
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ASSET_BACKGROUND = Path(__file__).with_name("assets") / "blackbox-rec-mockup-background.png"
LEGACY_BACKGROUND = Path(r"D:\Pictures\blackbox\Blackbox rec mockup background.png")
SQUARE_CANVAS_SIZE = (3544, 3543)
CANVAS_SIZE = SQUARE_CANVAS_SIZE
SQUARE_COVER = (2420, 562, 610, 34, 38, 42)
SAFE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


@dataclass(frozen=True)
class MockupPreset:
    suffix: str
    canvas_size: tuple[int, int]
    cover_size: int
    cover_xy: tuple[int, int]
    shadow: tuple[int, int, int]


PRESETS = {
    "square": MockupPreset("vinyl-mockup.webp", SQUARE_CANVAS_SIZE, SQUARE_COVER[0], (SQUARE_COVER[1], SQUARE_COVER[2]), SQUARE_COVER[3:]),
    "post": MockupPreset("album-cover-instagram-facebook-post-1080x1350.jpg", (1080, 1350), 720, (180, 352), (24, 24, 24)),
    "story": MockupPreset("album-cover-instagram-story-1080x1920.jpg", (1080, 1920), 760, (160, 750), (26, 28, 28)),
}


def render_vinyl_mockup(cover_path: Path, out_path: Path, background_path: Path | None = None) -> None:
    render_mockup(cover_path, out_path, PRESETS["square"], background_path)


def render_mockup(cover_path: Path, out_path: Path, preset: MockupPreset, background_path: Path | None = None) -> None:
    with Image.open(cover_path) as image:
        cover = square_cover(image.convert("RGBA")).resize((preset.cover_size, preset.cover_size), Image.Resampling.LANCZOS)
    canvas = fit_background(resolve_background(background_path), preset.canvas_size)
    x, y = preset.cover_xy
    shadow_dx, shadow_dy, blur = preset.shadow
    shadow = Image.new("RGBA", preset.canvas_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.rectangle((x + shadow_dx, y + shadow_dy, x + preset.cover_size + shadow_dx, y + preset.cover_size + shadow_dy), fill=(0, 0, 0, 170))
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(cover, (x, y))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    save_kwargs = {"quality": 94}
    if out_path.suffix.lower() == ".webp":
        save_kwargs = {"quality": 88, "method": 6}
    canvas.convert("RGB").save(out_path, **save_kwargs)


def square_cover(image: Image.Image) -> Image.Image:
    side = min(image.size)
    left = (image.width - side) // 2
    top = (image.height - side) // 2
    return image.crop((left, top, left + side, top + side))


def resolve_background(path: Path | None = None) -> Path:
    if path:
        return path
    if ASSET_BACKGROUND.exists():
        return ASSET_BACKGROUND
    if LEGACY_BACKGROUND.exists():
        return LEGACY_BACKGROUND
    raise FileNotFoundError("Mockup background not found. Pass --background.")


def fit_background(path: Path, size: tuple[int, int]) -> Image.Image:
    with Image.open(path) as image:
        image = image.convert("RGBA")
        scale = max(size[0] / image.width, size[1] / image.height)
        resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def batch(input_dir: Path, out_dir: Path, presets: list[str] | None = None, background_path: Path | None = None) -> list[Path]:
    presets = presets or ["square"]
    outputs = []
    for cover in sorted(path for path in input_dir.iterdir() if path.suffix.lower() in SAFE_SUFFIXES):
        for name in presets:
            preset = PRESETS[name]
            out = out_dir / f"{cover.stem}-{preset.suffix}"
            render_mockup(cover, out, preset, background_path)
            outputs.append(out)
    return outputs


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Create BlackBox-style vinyl cover mockups.")
    parser.add_argument("--cover", type=Path, help="Single cover image.")
    parser.add_argument("--input-dir", type=Path, help="Directory of cover images.")
    parser.add_argument("--out", type=Path, help="Output image for --cover.")
    parser.add_argument("--out-dir", type=Path, default=Path("./mockups"), help="Output directory for --input-dir.")
    parser.add_argument("--background", type=Path, help="Override mockup background image.")
    parser.add_argument("--preset", choices=sorted(PRESETS), default="square", help="Output preset for --cover.")
    parser.add_argument("--social", action="store_true", help="Batch post and story outputs.")
    args = parser.parse_args(argv)
    presets = ["post", "story"] if args.social else [args.preset]
    if args.cover:
        for name in presets:
            preset = PRESETS[name]
            out = args.out if args.out and len(presets) == 1 else args.out_dir / f"{args.cover.stem}-{preset.suffix}"
            render_mockup(args.cover, out, preset, args.background)
        return 0
    if args.input_dir:
        batch(args.input_dir, args.out_dir, presets, args.background)
        return 0
    parser.error("Provide --cover or --input-dir")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
