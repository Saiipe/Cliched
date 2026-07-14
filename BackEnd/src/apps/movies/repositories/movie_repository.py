from apps.movies.models import Movie


class MovieRepository:
    @staticmethod
    def get_by_tmdb_id(tmdb_id: int) -> Movie | None:
        return Movie.objects.filter(tmdb_id=tmdb_id).first()

    @staticmethod
    def create(**fields) -> Movie:
        return Movie.objects.create(**fields)
