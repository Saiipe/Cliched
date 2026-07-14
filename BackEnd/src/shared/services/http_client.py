import logging
import time
from threading import Lock

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger("apps")


class RateLimiter:
    """Spaces out calls so we stay under a requests-per-second ceiling
    proactively, instead of only reacting after the server sends a 429."""

    def __init__(self, max_per_second: float):
        self._min_interval = 1.0 / max_per_second if max_per_second > 0 else 0
        self._lock = Lock()
        self._last_call = 0.0

    def wait(self):
        if self._min_interval <= 0:
            return
        with self._lock:
            elapsed = time.monotonic() - self._last_call
            sleep_for = self._min_interval - elapsed
            if sleep_for > 0:
                time.sleep(sleep_for)
            self._last_call = time.monotonic()


class RetryableAPIClient:
    """requests.Session wrapper for third-party APIs: self-throttles to a
    requests/second ceiling and retries on 429/5xx, honoring the
    Retry-After header when the server sends one (e.g. TMDB rate limits).
    """

    def __init__(
        self,
        base_url: str,
        max_per_second: float = 0,
        max_retries: int = 5,
        timeout: float = 10,
        headers: dict | None = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.rate_limiter = RateLimiter(max_per_second)

        retry = Retry(
            total=max_retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            respect_retry_after_header=True,
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retry)

        self.session = requests.Session()
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)
        if headers:
            self.session.headers.update(headers)

    def request(self, method: str, path: str, **kwargs) -> requests.Response:
        self.rate_limiter.wait()
        url = f"{self.base_url}/{path.lstrip('/')}"
        kwargs.setdefault("timeout", self.timeout)

        response = self.session.request(method, url, **kwargs)

        if response.status_code == 429:
            logger.warning(
                "Rate limited by %s after exhausting retries (Retry-After=%s)",
                url,
                response.headers.get("Retry-After"),
            )

        response.raise_for_status()
        return response

    def get(self, path: str, **kwargs) -> requests.Response:
        return self.request("GET", path, **kwargs)
