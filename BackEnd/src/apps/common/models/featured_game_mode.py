from django.db import models

from shared.mixins.timestamped import TimestampedModel


class FeaturedGameMode(TimestampedModel):
    """Which game modes are highlighted on the home page, and in what order.

    `game_mode_id` matches the frontend's static catalog ids (synopsis,
    frame, soundtrack, cast, daily, ...); there is no backend model for
    game modes themselves yet (only the daily challenge has real domain
    logic), so this just references them by id. Shared/global by design:
    every visitor sees the same home page, so this can't live in a
    per-browser store like localStorage."""

    game_mode_id = models.CharField(max_length=50, unique=True)
    order = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.game_mode_id} (#{self.order})"
