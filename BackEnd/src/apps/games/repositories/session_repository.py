import uuid

from apps.games.models import DailyChallenge, GameSession


class SessionRepository:
    @staticmethod
    def for_user(challenge: DailyChallenge, user) -> GameSession | None:
        return GameSession.objects.filter(challenge=challenge, user=user).first()

    @staticmethod
    def for_anon_token(challenge: DailyChallenge, token) -> GameSession | None:
        try:
            token = uuid.UUID(str(token))
        except (ValueError, AttributeError, TypeError):
            return None
        return GameSession.objects.filter(challenge=challenge, anon_token=token).first()

    @staticmethod
    def create_for_user(challenge: DailyChallenge, user) -> GameSession:
        return GameSession.objects.create(challenge=challenge, user=user)

    @staticmethod
    def create_anonymous(challenge: DailyChallenge) -> GameSession:
        return GameSession.objects.create(challenge=challenge, anon_token=uuid.uuid4())

    @staticmethod
    def locked(session_id: int) -> GameSession:
        return (
            GameSession.objects.select_for_update()
            .select_related("challenge__movie")
            .get(pk=session_id)
        )

    @staticmethod
    def finished_for_user(user):
        return (
            GameSession.objects.select_related("challenge__movie")
            .filter(user=user)
            .order_by("-challenge__date")
        )
