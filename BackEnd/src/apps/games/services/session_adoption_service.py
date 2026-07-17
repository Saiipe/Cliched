import uuid

from apps.games.models import GameSession


class SessionAdoptionService:
    """Transfere o progresso de uma sessão anônima para a conta no momento
    do login/cadastro: é o que faz "salvar o progresso" funcionar quando o
    jogador começou a jogar sem conta."""

    @staticmethod
    def adopt(user, anon_token) -> None:
        if not anon_token:
            return
        try:
            token = uuid.UUID(str(anon_token))
        except (ValueError, AttributeError, TypeError):
            return

        for session in GameSession.objects.filter(anon_token=token):
            # A conta já jogou este desafio por si, então o progresso da conta vence.
            if GameSession.objects.filter(
                challenge=session.challenge, user=user
            ).exists():
                continue
            session.user = user
            session.anon_token = None  # constraint user-xor-anon exige limpar
            session.save(update_fields=["user", "anon_token", "updated_at"])
