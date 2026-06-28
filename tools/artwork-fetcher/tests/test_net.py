import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from artwork_fetcher.net import Http


class FakeResponse:
    def __init__(self, status_code: int, headers: dict[str, str] | None = None):
        self.status_code = status_code
        self.headers = headers or {}


class FakeSession:
    def __init__(self, responses: list[FakeResponse]):
        self.responses = responses

    def get(self, *args, **kwargs):
        return self.responses.pop(0)


class NetTests(unittest.TestCase):
    def test_get_respects_retry_after(self):
        with tempfile.TemporaryDirectory() as tmp:
            http = Http(Path(tmp), "test-agent")
            http.session = FakeSession([FakeResponse(429, {"Retry-After": "3"}), FakeResponse(200)])

            with patch("artwork_fetcher.net.logging.warning") as warning, patch("artwork_fetcher.net.time.sleep") as sleep:
                response = http.get("https://example.com/image.jpg")

            self.assertEqual(response.status_code, 200)
            warning.assert_called()
            sleep.assert_any_call(3)

    def test_get_does_not_sleep_after_final_attempt(self):
        with tempfile.TemporaryDirectory() as tmp:
            http = Http(Path(tmp), "test-agent")
            http.session = FakeSession([FakeResponse(429, {"Retry-After": "30"})])

            with patch("artwork_fetcher.net.logging.warning"), patch("artwork_fetcher.net.time.sleep") as sleep:
                response = http.get("https://example.com/image.jpg", attempts=1)

            self.assertIsNone(response)
            sleep.assert_not_called()


if __name__ == "__main__":
    unittest.main()
