from datetime import date

from apps.movies.models import Movie
from apps.movies.repositories.movie_repository import MovieRepository
from apps.movies.services.tmdb_service import TMDBService
from shared.constants.geo import continent_for

TOP_CAST_N = 5


class MovieSyncService:
    """Fetches a movie (with credits) from TMDB and persists it as a Movie
    snapshot. Idempotent: an already-synced movie is returned from the DB
    without touching TMDB."""

    def __init__(self, tmdb_service: TMDBService | None = None):
        self._tmdb = tmdb_service or TMDBService()

    def sync_movie(self, tmdb_id: int) -> Movie:
        existing = MovieRepository.get_by_tmdb_id(tmdb_id)
        if existing:
            return existing

        payload = self._tmdb.get_movie_with_credits(tmdb_id)
        return MovieRepository.create(**self._map_payload(payload))

    @staticmethod
    def _map_payload(payload: dict) -> dict:
        release_date = None
        release_year = None
        if payload.get("release_date"):
            release_date = date.fromisoformat(payload["release_date"])
            release_year = release_date.year

        origin_country = (payload.get("origin_country") or [""])[0]

        credits = payload.get("credits") or {}
        director = next(
            (p["name"] for p in credits.get("crew", []) if p.get("job") == "Director"),
            "",
        )
        cast = sorted(credits.get("cast", []), key=lambda p: p.get("order", 999))
        top_cast = [{"id": p["id"], "name": p["name"]} for p in cast[:TOP_CAST_N]]

        return {
            "tmdb_id": payload["id"],
            "title": payload.get("title", ""),
            "original_title": payload.get("original_title", ""),
            "release_date": release_date,
            "release_year": release_year,
            "genres": payload.get("genres", []),
            "origin_country": origin_country,
            "continent": continent_for(origin_country),
            "director": director,
            "top_cast": top_cast,
            "runtime": payload.get("runtime") or None,
            "poster_path": payload.get("poster_path") or "",
            "popularity": payload.get("popularity") or 0,
        }
