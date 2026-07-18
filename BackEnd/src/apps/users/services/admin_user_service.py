from collections import defaultdict

from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.authentication.models import LoginEvent
from apps.games.models import GameSession
from shared.services.streak_calculator import best_streak, current_streak

User = get_user_model()


class AdminUserService:
    """Dados exibidos na tela de Usuários do admin: perfil, último acesso,
    vitórias no desafio diário e as sequências (atual e melhor). A posição
    de ranking saiu daqui: ranking agora é o sistema público em
    `apps.rankings`."""

    @staticmethod
    def list_with_stats() -> list[dict]:
        won_dates_by_user: dict[int, set] = defaultdict(set)
        for user_id, challenge_date in GameSession.objects.filter(
            status=GameSession.Status.WON, user_id__isnull=False
        ).values_list("user_id", "challenge__date"):
            won_dates_by_user[user_id].add(challenge_date)

        today = timezone.localdate()
        result = []
        for user in User.objects.all().order_by("-date_joined"):
            won_dates = won_dates_by_user.get(user.id, set())
            best_length, _ = best_streak(won_dates)
            result.append(
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_active": user.is_active,
                    "is_superuser": user.is_superuser,
                    "is_premium": user.is_premium,
                    "date_joined": user.date_joined,
                    "last_login": user.last_login,
                    "total_wins": len(won_dates),
                    "current_streak": current_streak(won_dates, today),
                    "best_streak": best_length,
                }
            )
        return result

    @staticmethod
    def login_history(user_id: int) -> list[dict]:
        events = LoginEvent.objects.filter(user_id=user_id)[:50]
        return [
            {"created_at": event.created_at, "ip_address": event.ip_address}
            for event in events
        ]
