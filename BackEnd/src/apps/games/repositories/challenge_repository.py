from datetime import date

from apps.games.models import DailyChallenge


class ChallengeRepository:
    @staticmethod
    def get_ready_by_date(day: date) -> DailyChallenge | None:
        return (
            DailyChallenge.objects.select_related("movie")
            .filter(date=day, status=DailyChallenge.Status.READY)
            .first()
        )

    @staticmethod
    def get_by_date(day: date) -> DailyChallenge | None:
        return DailyChallenge.objects.select_related("movie").filter(date=day).first()

    @staticmethod
    def create(day: date, movie) -> DailyChallenge:
        return DailyChallenge.objects.create(date=day, movie=movie)

    @staticmethod
    def used_tmdb_ids() -> set[int]:
        return set(DailyChallenge.objects.values_list("movie__tmdb_id", flat=True))
