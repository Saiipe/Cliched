from django.db import models

from shared.mixins.timestamped import TimestampedModel


class MockPlayer(TimestampedModel):
    """Jogador fictício que popula os rankings enquanto a base é pequena.

    São linhas comuns de banco misturadas aos usuários reais na hora de
    montar o ranking; quando houver gente suficiente basta apagar as
    linhas (ou parte delas), nenhuma lógica muda. Os valores por período
    são armazenados separadamente (semana ≤ mês ≤ geral) porque um mock
    não tem sessões reais das quais derivar janelas de tempo.

    `is_active` controla quais mocks aparecem no ranking: só um roster
    fixo de 10 fica visível por vez (pedido explícito, pra não parecer
    uma lista infinita de gente fictícia), o resto é reserva. Quando um
    usuário real se cadastra com o mesmo nome de um mock ativo,
    `MockPlayerRotationService` desativa esse mock e ativa outro da
    reserva, mantendo sempre 10 visíveis.
    """

    display_name = models.CharField(max_length=150, unique=True)
    is_active = models.BooleanField(default=True)

    weekly_points = models.PositiveIntegerField(default=0)
    monthly_points = models.PositiveIntegerField(default=0)
    total_points = models.PositiveIntegerField(default=0)

    weekly_streak = models.PositiveSmallIntegerField(default=0)
    monthly_streak = models.PositiveSmallIntegerField(default=0)
    best_streak = models.PositiveSmallIntegerField(default=0)

    streak_achieved_on = models.DateField(null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"MockPlayer {self.display_name}"
