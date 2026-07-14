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

    date = models.DateField(unique=True, db_index=True)
    movie = models.ForeignKey(
        "movies.Movie", on_delete=models.PROTECT, related_name="daily_challenges"
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )

    def __str__(self):
        return f"DailyChallenge {self.date} ({self.status})"
