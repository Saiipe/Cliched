from django.db import models

from shared.mixins.timestamped import TimestampedModel


class CastChallenge(TimestampedModel):
    """One movie per calendar date for the cast-guessing game.

    Separate from DailyChallenge on purpose: each game is isolated (own
    movie pick, own sessions), and sharing the daily movie would leak the
    daily answer to whoever plays this mode first."""

    class Status(models.TextChoices):
        PENDING = "pending"
        READY = "ready"
        FAILED = "failed"

    date = models.DateField(unique=True, db_index=True)
    movie = models.ForeignKey(
        "movies.Movie", on_delete=models.PROTECT, related_name="cast_challenges"
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )

    def __str__(self):
        return f"CastChallenge {self.date} ({self.status})"
