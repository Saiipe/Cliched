from django.conf import settings

from shared.services.http_client import RetryableAPIClient


class TMDBService:
    """Talks to The Movie Database API.

    Uses the v4 read-access Bearer token (not the v3 api_key query param).
    Retry/backoff and the requests/second ceiling live in
    shared.services.http_client.RetryableAPIClient — this class only knows
    about TMDB's endpoints and response shapes.
    """

    def __init__(self):
        self._client = RetryableAPIClient(
            base_url=settings.TMDB_BASE_URL,
            max_per_second=settings.TMDB_MAX_REQUESTS_PER_SECOND,
            headers={
                "Authorization": f"Bearer {settings.TMDB_READ_ACCESS_TOKEN}",
                "Accept": "application/json",
            },
        )

    def search_movies(self, query: str, page: int = 1, language: str = "pt-BR") -> dict:
        response = self._client.get(
            "search/movie",
            params={
                "query": query,
                "page": page,
                "language": language,
                "include_adult": False,
            },
        )
        return response.json()

    def get_movie(self, tmdb_id: int, language: str = "pt-BR") -> dict:
        response = self._client.get(f"movie/{tmdb_id}", params={"language": language})
        return response.json()

    def get_movie_with_credits(self, tmdb_id: int, language: str = "pt-BR") -> dict:
        response = self._client.get(
            f"movie/{tmdb_id}",
            params={"language": language, "append_to_response": "credits"},
        )
        return response.json()

    def get_movie_images(self, tmdb_id: int) -> dict:
        """Full art gallery (many posters/backdrops), unlike movie-details'
        single default poster_path/backdrop_path. include_image_language
        widens the pool beyond the (usually near-empty) untagged-only
        default filter."""
        response = self._client.get(
            f"movie/{tmdb_id}/images",
            params={"include_image_language": "pt,en,null"},
        )
        return response.json()

    def discover_movies(self, page: int = 1, language: str = "pt-BR", **filters) -> dict:
        params = {
            "page": page,
            "language": language,
            "include_adult": False,
            "sort_by": "popularity.desc",
            **filters,
        }
        response = self._client.get("discover/movie", params=params)
        return response.json()
