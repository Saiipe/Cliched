import re

from django.core.exceptions import ValidationError


def validate_positive(value):
    if value < 0:
        raise ValidationError(f"{value} must be a positive number.")


# Allowlist, não denylist: mais seguro contra XSS/SQL/shell injection via
# nome de usuário (aparece em URLs, é exibido sem escape em vários lugares
# do front). Sem espaço, aspas, `<`/`>`, `;`, `\`, `&`, `%`, `/`: só
# letras, números e uma pontuação segura e comum em nicknames
# (ex.: "T4uan", "Jjuli$", "joab?!").
USERNAME_MIN_LENGTH = 6
_USERNAME_ALLOWED_CHARS = re.compile(r"^[A-Za-z0-9_.$!?-]+$")


def validate_username_format(value: str) -> None:
    """Allowlist de caracteres + tamanho mínimo do nome de usuário.

    Mensagem de propósito genérica: nunca diz *qual* regra falhou (nem
    comprimento, nem qual caractere), pra não facilitar descobrir a regra
    por tentativa e erro (ver `UsernameAvailabilityView`, que só devolve
    disponível/indisponível)."""
    if len(value) < USERNAME_MIN_LENGTH or not _USERNAME_ALLOWED_CHARS.match(value):
        raise ValidationError("Nome de usuário inválido.")
