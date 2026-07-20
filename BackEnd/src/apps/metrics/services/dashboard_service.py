from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.games.models import CastSession, GameSession
from apps.movies.models import Movie

User = get_user_model()

_WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

# Modo -> queryset de sessões desse modo. Só os dois modos com lógica de
# domínio implementada hoje (ver apps.games); os outros do catálogo do
# frontend (Sinopse, Frame do Dia, Trilha Sonora) ainda não têm sessões
# reais pra contar.
_MODES = {
    "Desafio Diário": GameSession,
    "Elenco": CastSession,
}


class DashboardService:
    """Números reais pro dashboard do admin: nada aqui é mockado."""

    @staticmethod
    def get_stats() -> dict:
        today = timezone.localdate()
        week_start = today - timedelta(days=6)

        matches_today = sum(
            model.objects.filter(created_at__date=today).count() for model in _MODES.values()
        )

        finished_statuses = [GameSession.Status.WON, GameSession.Status.LOST]
        won = sum(
            model.objects.filter(status=model.Status.WON).count() for model in _MODES.values()
        )
        finished = sum(
            model.objects.filter(status__in=finished_statuses).count()
            for model in _MODES.values()
        )
        average_accuracy = round(won / finished * 100) if finished else 0

        matches_trend = []
        for offset in range(6, -1, -1):
            day = today - timedelta(days=offset)
            count = sum(model.objects.filter(created_at__date=day).count() for model in _MODES.values())
            matches_trend.append({"label": _WEEKDAY_LABELS[day.weekday()], "value": count})

        game_modes_popularity = [
            {"label": label, "value": model.objects.count()} for label, model in _MODES.items()
        ]

        return {
            "players_count": User.objects.count(),
            "movies_count": Movie.objects.count(),
            "matches_today": matches_today,
            "average_accuracy": average_accuracy,
            "matches_trend": matches_trend,
            "game_modes_popularity": game_modes_popularity,
        }
