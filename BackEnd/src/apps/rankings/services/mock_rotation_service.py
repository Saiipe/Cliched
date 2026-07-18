from apps.rankings.models import MockPlayer


class MockPlayerRotationService:
    """Mantém o roster de mocks visíveis sempre com exatamente 10 nomes,
    sem nunca colidir com o nome de um usuário real.

    Chamado no cadastro (`RegisterView`): se o username escolhido bate
    (case-insensitive) com um mock hoje ativo, esse mock sai do ranking
    e outro da reserva assume o lugar dele. Sem essa troca, a mesma
    pessoa fictícia continuaria aparecendo ao lado de um usuário real de
    nome idêntico, confuso pra quem olha o ranking.
    """

    @staticmethod
    def swap_if_collision(username: str) -> None:
        colliding = MockPlayer.objects.filter(
            display_name__iexact=username, is_active=True
        ).first()
        if colliding is None:
            return

        replacement = MockPlayer.objects.filter(is_active=False).order_by("?").first()

        colliding.is_active = False
        colliding.save(update_fields=["is_active"])

        if replacement is not None:
            replacement.is_active = True
            replacement.save(update_fields=["is_active"])
