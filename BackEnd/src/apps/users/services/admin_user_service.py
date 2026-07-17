from django.contrib.auth import get_user_model
from django.db.models import Count

from apps.authentication.models import LoginEvent
from apps.games.models import GameSession

User = get_user_model()


class AdminUserService:
    """Dados exibidos na tela de Usuários do admin: perfil, último acesso e
    uma posição de "rank" — calculada na hora (por total de vitórias no
    desafio diário), não é um sistema de ranking persistido/pontuado."""

    @staticmethod
    def list_with_stats() -> list[dict]:
        wins_by_user = dict(
            GameSession.objects.filter(
                status=GameSession.Status.WON, user_id__isnull=False
            )
            .values("user_id")
            .annotate(total=Count("id"))
            .values_list("user_id", "total")
        )

        users = list(User.objects.all().order_by("-date_joined"))
        ranked_ids = sorted(
            (u.id for u in users), key=lambda uid: wins_by_user.get(uid, 0), reverse=True
        )
        position_by_id = {uid: index + 1 for index, uid in enumerate(ranked_ids)}

        return [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
                "is_premium": user.is_premium,
                "date_joined": user.date_joined,
                "last_login": user.last_login,
                "total_wins": wins_by_user.get(user.id, 0),
                "rank_position": position_by_id[user.id],
            }
            for user in users
        ]

    @staticmethod
    def login_history(user_id: int) -> list[dict]:
        events = LoginEvent.objects.filter(user_id=user_id)[:50]
        return [
            {"created_at": event.created_at, "ip_address": event.ip_address}
            for event in events
        ]
