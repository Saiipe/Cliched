from django.conf import settings
from django.db import models

from apps.games.constants import INITIAL_SCORE
from shared.mixins.timestamped import TimestampedModel


class CastSession(TimestampedModel):
    """One player's run at a cast challenge.

    Guesses live inline as JSON (no clue evaluation in this game, the
    "clue" is simply the next revealed cast member), so a separate attempt
    table would only add joins. Anonymous players get their own token,
    stored under a different key in the frontend than the daily one."""

    class Status(models.TextChoices):
        PLAYING = "playing"
        WON = "won"
        LOST = "lost"

    challenge = models.ForeignKey(
        "games.CastChallenge", on_delete=models.CASCADE, related_name="sessions"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="cast_sessions",
    )
    anon_token = models.UUIDField(null=True, blank=True, unique=True, db_index=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PLAYING
    )
    attempts_used = models.PositiveSmallIntegerField(default=0)
    score = models.PositiveSmallIntegerField(default=INITIAL_SCORE)
    # [{"tmdb_id": int, "title": str, "is_correct": bool}]
    guesses = models.JSONField(default=list)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["challenge", "user"],
                condition=models.Q(user__isnull=False),
                name="uniq_cast_user_challenge",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(user__isnull=False, anon_token__isnull=True)
                    | models.Q(user__isnull=True, anon_token__isnull=False)
                ),
                name="cast_session_user_xor_anon",
            ),
        ]

    def __str__(self):
        who = self.user_id or self.anon_token
        return f"CastSession {who} @ {self.challenge_id} ({self.status})"
