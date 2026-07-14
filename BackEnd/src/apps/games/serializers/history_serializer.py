from django.utils import timezone
from rest_framework import serializers

from apps.games.models import GameSession


class HistorySessionSerializer(serializers.ModelSerializer):
    """Past sessions of an authenticated user.

    Revealing the movie is fine for finished games and for past dates
    (exposed as "lost"). Today's still-running session keeps `movie` null —
    the answer must never leak mid-game."""

    date = serializers.DateField(source="challenge.date")
    status = serializers.SerializerMethodField()
    movie = serializers.SerializerMethodField()

    class Meta:
        model = GameSession
        fields = ["date", "status", "attempts_used", "score", "movie"]

    def get_status(self, session):
        if (
            session.status == GameSession.Status.PLAYING
            and session.challenge.date < timezone.localdate()
        ):
            return GameSession.Status.LOST.value
        return session.status

    def get_movie(self, session):
        if self.get_status(session) == GameSession.Status.PLAYING:
            return None  # today's game still running — never leak the answer
        movie = session.challenge.movie
        return {
            "tmdb_id": movie.tmdb_id,
            "title": movie.title,
            "release_year": movie.release_year,
        }
