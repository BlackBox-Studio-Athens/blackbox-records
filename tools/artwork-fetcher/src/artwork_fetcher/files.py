import csv
import hashlib
import mimetypes
import re
from io import BytesIO
from pathlib import Path

from .models import FetchResult, MANIFEST_COLUMNS, Release
from .text import clean_text


def safe_filename_component(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r'[\/\\:*?"<>|]+', "_", clean_text(value))).rstrip(" .") or "_"


def mime_extension(mime_type: str) -> str:
    mime = (mime_type or "").split(";")[0].strip().lower()
    return {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}.get(mime, mimetypes.guess_extension(mime) or ".img")


def safe_filename(release: Release, mime_type: str, images_dir: Path) -> Path:
    ext = mime_extension(mime_type)
    stem = (
        f"{release.row_number:03d} - {safe_filename_component(release.normalized_artist)} - "
        f"{safe_filename_component(release.normalized_title)} [{safe_filename_component(release.normalized_format)}] - cover"
    )
    path = images_dir / f"{stem}{ext}"
    for suffix in range(2, 1000):
        if not path.exists():
            return path
        path = images_dir / f"{stem} - {suffix}{ext}"
    raise RuntimeError(f"Too many filename collisions for {stem}")


def image_dimensions(data: bytes) -> tuple[int | str, int | str]:
    from PIL import Image

    with Image.open(BytesIO(data)) as image:
        image.verify()
    with Image.open(BytesIO(data)) as image:
        return image.size


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_manifest(path: Path, results: list[FetchResult]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=MANIFEST_COLUMNS)
        writer.writeheader()
        writer.writerows(result.manifest_row() for result in results)


def write_manual_review(path: Path, results: list[FetchResult]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t")
        writer.writerow(["artist", "title", "format", "suggested_search_query", "notes"])
        for result in results:
            if result.status == "missing" or result.confidence == "low":
                release = result.release
                writer.writerow(
                    [
                        release.normalized_artist,
                        release.normalized_title,
                        release.normalized_format,
                        f"{release.normalized_artist} {release.normalized_title} cover art",
                        result.notes,
                    ]
                )
