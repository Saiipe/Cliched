from datetime import date, datetime

from django.core.cache import cache

from apps.rankings.dtos.ranking_entry import RankingEntryDTO
from apps.rankings.models import RankingSettings
from apps.rankings.repositories.mock_player_repository import MockPlayerRepository
from apps.rankings.repositories.real_player_repository import RealPlayerRepository
from apps.rankings.utils.periods import VALID_PERIODS, period_start

TYPE_STREAK = "streak"
TYPE_POINTS = "points"
TYPE_COMBINED = "combined"

VALID_TYPES = (TYPE_STREAK, TYPE_POINTS, TYPE_COMBINED)

DEFAULT_LIMIT = 25
MAX_LIMIT = 100

# Rankings são leitura pública e cara de montar; um cache curto segura
# rajadas sem deixar o placar visivelmente defasado.
_CACHE_SECONDS = 120


def _ordinal(value: date | None) -> float:
    return value.toordinal() if value is not None else float("-inf")


def _timestamp(value: datetime | None) -> float:
    return value.timestamp() if value is not None else float("-inf")


# Regras de ordenação por tipo (todas descendentes, por isso os sinais
# invertidos). Novo tipo de ranking = uma chave nova aqui.
_SORT_KEYS = {
    TYPE_STREAK: lambda e: (
        -e.streak,
        -e.points,
        -_ordinal(e.streak_achieved_on),
    ),
    TYPE_POINTS: lambda e: (-e.points, -e.streak),
    TYPE_COMBINED: lambda e: (
        -e.points,
        -e.streak,
        -_timestamp(e.last_activity_at),
    ),
}


class RankingService:
    """Monta um ranking: junta candidatos reais e mocks, ordena e corta.

    Mocks e reais competem na mesma lista de propósito: quando os mocks
    forem apagados do banco, nada aqui muda.
    """

    @staticmethod
    def get_ranking(
        ranking_type: str, period: str, limit: int = DEFAULT_LIMIT
    ) -> list[dict]:
        if ranking_type not in VALID_TYPES:
            raise ValueError(f"Tipo de ranking inválido: {ranking_type}")
        if period not in VALID_PERIODS:
            raise ValueError(f"Período inválido: {period}")
        limit = max(1, min(limit, MAX_LIMIT))

        cache_key = f"rankings:{ranking_type}:{period}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        entries = RealPlayerRepository.list_entries(period_start(period))
        if RankingSettings.current().mocks_enabled:
            entries += MockPlayerRepository.list_entries(period)
        entries = [e for e in entries if e.points > 0 or e.streak > 0]
        entries.sort(key=_SORT_KEYS[ranking_type])

        ranked = [
            RankingService._to_public_dict(position, entry)
            for position, entry in enumerate(entries[:limit], start=1)
        ]
        cache.set(cache_key, ranked, _CACHE_SECONDS)
        return ranked

    @staticmethod
    def _to_public_dict(position: int, entry: RankingEntryDTO) -> dict:
        return {
            "position": position,
            "player_name": entry.player_name,
            "points": entry.points,
            "streak": entry.streak,
            "is_real": entry.is_real,
        }
