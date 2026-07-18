from django.utils import timezone

from apps.games.models import GameSession
from shared.services.streak_calculator import best_streak, current_streak


class StreakService:
    """Sequências de dias consecutivos em que o usuário venceu o desafio
    diário. A matemática fica em `shared.services.streak_calculator`,
    compartilhada com o ranking; aqui só se busca as datas no banco."""

    @staticmethod
    def _won_dates(user) -> set:
        return set(
            GameSession.objects.filter(
                user=user, status=GameSession.Status.WON
            ).values_list("challenge__date", flat=True)
        )

    @staticmethod
    def current_streak(user) -> int:
        return current_streak(StreakService._won_dates(user), timezone.localdate())

    @staticmethod
    def best_streak(user) -> int:
        length, _ = best_streak(StreakService._won_dates(user))
        return length
