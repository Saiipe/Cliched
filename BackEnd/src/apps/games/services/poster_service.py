from io import BytesIO
from pathlib import Path

from django.conf import settings
from PIL import Image

from apps.games.constants import POSTER_MAX_LEVEL, POSTER_PIXEL_BLOCKS
from apps.games.models import DailyChallenge, GameSession
from shared.exceptions.custom_exceptions import ResourceNotFound
from shared.services.http_client import RetryableAPIClient

TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"


class PosterService:
    """Downloads the TMDB poster once per challenge and pre-renders one JPEG
    per pixelation level. Files are keyed by challenge id (never by tmdb id)
    so their paths leak nothing about the answer."""

    def generate_levels(self, challenge: DailyChallenge) -> None:
        original = self._download(challenge.movie.poster_path)
        directory = self._challenge_dir(challenge.pk)
        directory.mkdir(parents=True, exist_ok=True)

        for level, block_width in POSTER_PIXEL_BLOCKS.items():
            image = original if block_width is None else self._pixelate(original, block_width)
            image.convert("RGB").save(directory / f"level_{level}.jpg", "JPEG", quality=85)

    @staticmethod
    def unlocked_level(session: GameSession | None) -> int:
        if session is None:
            return 0
        if session.status != GameSession.Status.PLAYING:
            return POSTER_MAX_LEVEL
        return min(session.attempts_used, POSTER_MAX_LEVEL - 1)

    def poster_file(self, challenge: DailyChallenge, level: int) -> Path:
        path = self._challenge_dir(challenge.pk) / f"level_{level}.jpg"
        if not path.is_file():
            raise ResourceNotFound("Pôster não encontrado para este nível.")
        return path

    @staticmethod
    def _challenge_dir(challenge_id: int) -> Path:
        return Path(settings.MEDIA_ROOT) / "posters" / "daily" / str(challenge_id)

    @staticmethod
    def _download(poster_path: str) -> Image.Image:
        client = RetryableAPIClient(base_url=TMDB_IMAGE_BASE_URL)
        response = client.get(poster_path)
        return Image.open(BytesIO(response.content))

    @staticmethod
    def _pixelate(image: Image.Image, block_width: int) -> Image.Image:
        width, height = image.size
        small_height = max(1, round(height * block_width / width))
        small = image.resize((block_width, small_height), Image.Resampling.LANCZOS)
        return small.resize((width, height), Image.Resampling.NEAREST)
