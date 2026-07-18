from apps.rankings.dtos.ranking_entry import RankingEntryDTO
from apps.rankings.models import MockPlayer
from apps.rankings.utils.periods import PERIOD_MONTH, PERIOD_WEEK

_FIELDS_BY_PERIOD = {
    PERIOD_WEEK: ("weekly_points", "weekly_streak"),
    PERIOD_MONTH: ("monthly_points", "monthly_streak"),
}


class MockPlayerRepository:
    """Converte as linhas de MockPlayer ativas nos candidatos do período
    pedido. Só mocks com `is_active=True` entram (roster fixo de 10, ver
    `apps.rankings.services.mock_rotation_service`); o resto é reserva e
    fica de fora até ser ativado."""

    @staticmethod
    def list_entries(period: str) -> list[RankingEntryDTO]:
        points_field, streak_field = _FIELDS_BY_PERIOD.get(
            period, ("total_points", "best_streak")
        )
        return [
            RankingEntryDTO(
                player_name=player.display_name,
                points=getattr(player, points_field),
                streak=getattr(player, streak_field),
                streak_achieved_on=player.streak_achieved_on,
                last_activity_at=player.last_activity_at,
                is_real=False,
            )
            for player in MockPlayer.objects.filter(is_active=True)
        ]
