from django.db import models

from shared.mixins.timestamped import TimestampedModel


class RankingSettings(TimestampedModel):
    """Singleton (uma linha só, pk sempre 1) com as configurações do
    ranking. Hoje só `mocks_enabled`: liga/desliga globalmente a exibição
    dos `MockPlayer` no ranking público, sem precisar apagar ou desativar
    cada linha individualmente. Controlado pelo admin em Configurações."""

    mocks_enabled = models.BooleanField(default=True)

    @classmethod
    def current(cls) -> "RankingSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"RankingSettings(mocks_enabled={self.mocks_enabled})"
