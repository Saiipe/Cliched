from collections import defaultdict
from datetime import datetime

from apps.games.models import CastSession, GameSession
from apps.rankings.dtos.ranking_entry import RankingEntryDTO
from shared.services.streak_calculator import best_streak


class RealPlayerRepository:
    """Monta os candidatos reais do ranking a partir das sessões vencidas.

    Nada é persistido por usuário: pontos são a soma dos scores das sessões
    vencidas na janela e a sequência vem das datas de vitória do desafio
    diário. Assim um usuário novo entra no ranking na primeira vitória, sem
    signal nem job. Se o volume um dia pesar, este repositório é o único
    lugar a trocar por uma tabela agregada.

    Usuários inativados pelo admin (`is_active=False`) são excluídos: o
    filtro é em `user__is_active`, então some do ranking assim que o admin
    inativa, sem precisar apagar histórico nenhum.
    """

    @staticmethod
    def list_entries(period_start: datetime | None) -> list[RankingEntryDTO]:
        points: dict[int, int] = defaultdict(int)
        last_activity: dict[int, datetime] = {}
        names: dict[int, str] = {}

        for model in (GameSession, CastSession):
            sessions = model.objects.filter(
                status=model.Status.WON, user_id__isnull=False, user__is_active=True
            )
            if period_start is not None:
                sessions = sessions.filter(finished_at__gte=period_start)
            for user_id, username, score, finished_at in sessions.values_list(
                "user_id", "user__username", "score", "finished_at"
            ):
                names[user_id] = username
                points[user_id] += score
                if finished_at and (
                    user_id not in last_activity or finished_at > last_activity[user_id]
                ):
                    last_activity[user_id] = finished_at

        won_dates: dict[int, set] = defaultdict(set)
        daily_wins = GameSession.objects.filter(
            status=GameSession.Status.WON, user_id__isnull=False, user__is_active=True
        )
        if period_start is not None:
            # A janela corta pela data do desafio: só contam vitórias de
            # dias dentro do período (uma sequência antiga não vaza).
            daily_wins = daily_wins.filter(challenge__date__gte=period_start.date())
        for user_id, challenge_date in daily_wins.values_list(
            "user_id", "challenge__date"
        ):
            won_dates[user_id].add(challenge_date)

        entries = []
        for user_id, username in names.items():
            streak, achieved_on = best_streak(won_dates.get(user_id, ()))
            entries.append(
                RankingEntryDTO(
                    player_name=username,
                    points=points[user_id],
                    streak=streak,
                    streak_achieved_on=achieved_on,
                    last_activity_at=last_activity.get(user_id),
                    is_real=True,
                    user_id=user_id,
                )
            )
        return entries
