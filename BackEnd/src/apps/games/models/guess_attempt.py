from django.db import models

from shared.mixins.timestamped import TimestampedModel


class GuessAttempt(TimestampedModel):
    session = models.ForeignKey(
        "games.GameSession", on_delete=models.CASCADE, related_name="attempts"
    )
    attempt_number = models.PositiveSmallIntegerField()
    guessed_movie = models.ForeignKey(
        "movies.Movie", on_delete=models.PROTECT, related_name="+"
    )
    is_correct = models.BooleanField(default=False)
    # Evaluation result frozen at guess time so the board can be rebuilt on GET.
    clues = models.JSONField(default=dict)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["session", "attempt_number"], name="uniq_session_attempt"
            ),
        ]
        ordering = ["attempt_number"]

    def __str__(self):
        return f"Attempt {self.attempt_number} of session {self.session_id}"
