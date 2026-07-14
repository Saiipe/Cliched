from django.db import models

from shared.mixins.timestamped import TimestampedModel


class Movie(TimestampedModel):
    """Persisted snapshot of a TMDB movie.

    Guess evaluation compares Movie vs Movie — never hits TMDB at request
    time. `poster_path` is the raw TMDB path and must never be exposed by
    the API (it would leak the daily answer).
    """

    tmdb_id = models.PositiveIntegerField(unique=True, db_index=True)
    title = models.CharField(max_length=255)
    original_title = models.CharField(max_length=255, blank=True, default="")
    release_date = models.DateField(null=True, blank=True)
    release_year = models.PositiveSmallIntegerField(null=True, blank=True)
    genres = models.JSONField(default=list)  # [{"id": 28, "name": "Ação"}]
    origin_country = models.CharField(max_length=2, blank=True, default="")
    continent = models.CharField(max_length=2, blank=True, default="")
    director = models.CharField(max_length=255, blank=True, default="")
    top_cast = models.JSONField(default=list)  # [{"id": 819, "name": "..."}]
    runtime = models.PositiveSmallIntegerField(null=True, blank=True)
    poster_path = models.CharField(max_length=255, blank=True, default="")
    popularity = models.FloatField(default=0)

    def __str__(self):
        return f"{self.title} ({self.release_year})"
