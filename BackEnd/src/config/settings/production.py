from .base import *  # noqa: F401,F403
from .base import env_bool

DEBUG = False

# Django roda atrás de um proxy reverso (confirmado: HTTP já responde
# 301 antes mesmo de chegar aqui), que termina o TLS e repassa a
# requisição pro container por HTTP puro internamente. Sem
# SECURE_PROXY_SSL_HEADER, o Django não tem como saber que a
# requisição original era HTTPS e trataria toda requisição como
# insegura — com SECURE_SSL_REDIRECT ligado isso vira loop de
# redirecionamento. Precisa confiar no cabeçalho X-Forwarded-Proto que
# o proxy envia (padrão pra Traefik/Nginx/Coolify).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
