from django.conf import settings
from django.db import models

from apps.games.constants import INITIAL_SCORE
from shared.mixins.timestamped import TimestampedModel


class GameSession(TimestampedModel):
    """One player's run at a daily challenge.

    Sessions exist for anonymous players too (identified by a server-issued
    opaque `anon_token`): the unlocked poster level is derived from
    `attempts_used`, so the server must own that counter or clients could
    request the clear poster immediately."""

    class Status(models.TextChoices):
        PLAYING = "playing"
        WON = "won"
        LOST = "lost"

    challenge = models.ForeignKey(
        "games.DailyChallenge", on_delete=models.CASCADE, related_name="sessions"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="game_sessions",
    )
    anon_token = models.UUIDField(null=True, blank=True, unique=True, db_index=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PLAYING
    )
    attempts_used = models.PositiveSmallIntegerField(default=0)
    score = models.PositiveSmallIntegerField(default=INITIAL_SCORE)
    hints_used = models.JSONField(default=list)  # reserved for the future hint system
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["challenge", "user"],
                condition=models.Q(user__isnull=False),
                name="uniq_user_challenge",
            ),
            models.UniqueConstraint(
                fields=["challenge", "anon_token"],
                condition=models.Q(anon_token__isnull=False),
                name="uniq_anon_challenge",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(user__isnull=False, anon_token__isnull=True)
                    | models.Q(user__isnull=True, anon_token__isnull=False)
                ),
                name="session_user_xor_anon",
            ),
        ]

    def __str__(self):
        who = self.user_id or self.anon_token
        return f"Session {who} @ {self.challenge_id} ({self.status})"
