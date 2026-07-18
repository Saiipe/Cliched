from dataclasses import dataclass
from datetime import date, datetime


@dataclass(frozen=True, slots=True)
class RankingEntryDTO:
    """Um jogador candidato a uma posição no ranking, real ou mock.

    A posição não mora aqui: ela só existe depois que o serviço ordena a
    lista completa segundo as regras do tipo de ranking pedido.
    """

    player_name: str
    points: int
    streak: int
    streak_achieved_on: date | None
    last_activity_at: datetime | None
    is_real: bool
    user_id: int | None = None
