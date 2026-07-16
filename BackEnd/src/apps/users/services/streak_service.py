from datetime import timedelta

from django.utils import timezone

from apps.games.models import GameSession


class StreakService:
    """Sequência de dias consecutivos em que o usuário venceu o desafio
    diário. Se o desafio de hoje ainda não foi vencido, a sequência que
    terminou ontem continua valendo (ainda dá tempo de mantê-la hoje)."""

    @staticmethod
    def current_streak(user) -> int:
        won_dates = set(
            GameSession.objects.filter(
                user=user, status=GameSession.Status.WON
            ).values_list("challenge__date", flat=True)
        )
        if not won_dates:
            return 0

        today = timezone.localdate()
        day = today if today in won_dates else today - timedelta(days=1)

        streak = 0
        while day in won_dates:
            streak += 1
            day -= timedelta(days=1)
        return streak
