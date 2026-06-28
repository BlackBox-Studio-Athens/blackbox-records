import hashlib
import json
import logging
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlparse

import requests


def read_json(path: Path) -> dict | list | None:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def cache_key(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:24]


class Http:
    HOST_DELAYS = {
        "api.discogs.com": 1.1,
        "coverartarchive.org": 1.0,
        "musicbrainz.org": 1.0,
    }
    DEFAULT_DELAY = 0.25

    def __init__(self, cache_dir: Path, user_agent: str):
        self.cache_dir = cache_dir
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": user_agent})
        self.last_request_at: dict[str, float] = {}

    def get(self, url: str, attempts: int = 4, headers: dict[str, str] | None = None) -> requests.Response | None:
        for attempt in range(attempts):
            try:
                self.wait_for_host(url)
                response = self.session.get(url, timeout=30, allow_redirects=True, headers=headers)
                if response.status_code not in {429, 503}:
                    self.log_rate_limit(response)
                    return response
                wait = retry_after_seconds(response) or 2**attempt
                logging.warning("Retryable HTTP %s for %s; retrying in %ss", response.status_code, url, wait)
            except requests.RequestException as exc:
                wait = 2**attempt
                logging.warning("Network error for %s: %s", url, exc)
            if attempt + 1 < attempts:
                time.sleep(wait)
        return None

    def text(self, url: str, headers: dict[str, str] | None = None) -> str:
        path = self.cache_dir / "pages" / f"{cache_key(url)}.html"
        if path.exists():
            return path.read_text(encoding="utf-8")
        response = self.get(url, headers=headers)
        if response is None or response.status_code >= 400:
            return ""
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(response.text, encoding="utf-8")
        return response.text

    def json(self, url: str, headers: dict[str, str] | None = None) -> dict | list | None:
        path = self.cache_dir / "json" / f"{cache_key(url)}.json"
        if path.exists():
            return read_json(path)
        response = self.get(url, headers=headers)
        if response is None or response.status_code >= 400:
            return None
        try:
            data = response.json()
        except ValueError:
            logging.warning("JSON parse failed for %s", url)
            return None
        write_json(path, data)
        return data

    def image(self, url: str) -> tuple[bytes, str]:
        key = cache_key(url)
        body_path = self.cache_dir / "images" / f"{key}.bin"
        meta_path = self.cache_dir / "images" / f"{key}.json"
        if body_path.exists() and meta_path.exists():
            meta = read_json(meta_path)
            return body_path.read_bytes(), meta.get("mime_type", "") if isinstance(meta, dict) else ""
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

    def wait_for_host(self, url: str) -> None:
        host = urlparse(url).hostname or ""
        delay = next((value for suffix, value in self.HOST_DELAYS.items() if host == suffix or host.endswith(f".{suffix}")), self.DEFAULT_DELAY)
        elapsed = time.monotonic() - self.last_request_at.get(host, 0)
        if elapsed < delay:
            time.sleep(delay - elapsed)
        self.last_request_at[host] = time.monotonic()

    def log_rate_limit(self, response: requests.Response) -> None:
        remaining = response.headers.get("X-Discogs-Ratelimit-Remaining")
        if remaining == "0":
            limit = response.headers.get("X-Discogs-Ratelimit")
            logging.warning("Discogs rate limit exhausted%s", f" ({limit}/minute)" if limit else "")


def retry_after_seconds(response: requests.Response) -> int | None:
    value = response.headers.get("Retry-After")
    if not value:
        return None
    try:
        return max(0, int(value))
    except ValueError:
        try:
            retry_at = parsedate_to_datetime(value)
        except (TypeError, ValueError):
            return None
        if retry_at.tzinfo is None:
            retry_at = retry_at.replace(tzinfo=timezone.utc)
        return max(0, int((retry_at - datetime.now(timezone.utc)).total_seconds()))
