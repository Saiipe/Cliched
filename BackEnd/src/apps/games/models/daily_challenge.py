from django.db import models

from shared.mixins.timestamped import TimestampedModel


class DailyChallenge(TimestampedModel):
    """One movie per calendar date, shared by all players.

    The unique `date` makes both the scheduled job and the lazy fallback
    idempotent. Endpoints only serve challenges in `ready` status (posters
    generated)."""

    class Status(models.TextChoices):
        PENDING = "pending"
        READY = "ready"
        FAILED = "failed"

    class ImageSource(models.TextChoices):
        POSTER = "poster"
        BACKDROP = "backdrop"

    date = models.DateField(unique=True, db_index=True)
    movie = models.ForeignKey(
        "movies.Movie", on_delete=models.PROTECT, related_name="daily_challenges"
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    # Which TMDB art the pixelated game image is generated from, chosen by
    # the admin while the challenge is still in the future.
    image_source = models.CharField(
        max_length=10, choices=ImageSource.choices, default=ImageSource.POSTER
    )
    # Specific TMDB image path within that source's gallery (movie.poster_path
    # is only the single "default" one; TMDB has many per movie). Blank
    # means "use the movie's default path for image_source".
    image_path = models.CharField(max_length=255, blank=True, default="")

    def __str__(self):
        return f"DailyChallenge {self.date} ({self.status})"
