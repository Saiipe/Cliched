from django.conf import settings
from django.db import models

from shared.mixins.timestamped import TimestampedModel


class LoginEvent(TimestampedModel):
    """Um registro por login bem-sucedido — histórico de acesso exibido
    pro admin na tela de Usuários. `created_at` (herdado) é o timestamp do
    login."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="login_events"
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Login de {self.user_id} em {self.created_at}"
