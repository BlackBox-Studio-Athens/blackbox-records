import hashlib
import json
import logging
import time
from pathlib import Path

import requests


def read_json(path: Path) -> dict | None:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def cache_key(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:24]


class Http:
    def __init__(self, cache_dir: Path, user_agent: str):
        self.cache_dir = cache_dir
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": user_agent})

    def get(self, url: str, attempts: int = 4) -> requests.Response | None:
        for attempt in range(attempts):
            try:
                response = self.session.get(url, timeout=30, allow_redirects=True)
                if response.status_code not in {429, 503}:
                    return response
                logging.warning("Retryable HTTP %s for %s", response.status_code, url)
            except requests.RequestException as exc:
                logging.warning("Network error for %s: %s", url, exc)
            time.sleep(2**attempt)
        return None

    def text(self, url: str) -> str:
        path = self.cache_dir / "pages" / f"{cache_key(url)}.html"
        if path.exists():
            return path.read_text(encoding="utf-8")
        response = self.get(url)
        if response is None or response.status_code >= 400:
            return ""
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(response.text, encoding="utf-8")
        return response.text

    def image(self, url: str) -> tuple[bytes, str]:
        key = cache_key(url)
        body_path = self.cache_dir / "images" / f"{key}.bin"
        meta_path = self.cache_dir / "images" / f"{key}.json"
        if body_path.exists() and meta_path.exists():
            return body_path.read_bytes(), read_json(meta_path).get("mime_type", "")
        response = self.get(url)
        if response is None:
            raise RuntimeError("image request failed")
        if response.status_code >= 400:
            raise RuntimeError(f"image request returned HTTP {response.status_code}")
        mime_type = response.headers.get("Content-Type", "").split(";")[0].strip()
        body_path.parent.mkdir(parents=True, exist_ok=True)
        body_path.write_bytes(response.content)
        write_json(meta_path, {"url": url, "mime_type": mime_type})
        return response.content, mime_type
