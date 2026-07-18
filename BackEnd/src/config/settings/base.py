"""
Base settings shared by every environment.
Environment-specific files (development.py, production.py, test.py) import from here.
"""

from datetime import timedelta
from pathlib import Path

from corsheaders.defaults import default_headers
from dotenv import load_dotenv

# config/settings/base.py -> config/settings -> config -> src -> BASE_DIR (backend root)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
SRC_DIR = BASE_DIR / "src"

# override=True: sem isso, o valor default do dotenv (não sobrescrever
# variável já existente em os.environ) faz o autoreload do `runserver`
# ignorar edições no .env pra sempre, pro processo inteiro — o restart do
# StatReloader é um `os.execv()`, que herda o `os.environ` do processo
# anterior (já populado pela 1ª leitura do .env), então uma chave só é
# "vista" de novo se o .env puder sobrescrever o que já está no ambiente.
# .env é a fonte da verdade neste projeto (nunca setamos as env vars por
# fora dele em dev), então sempre vencer é o comportamento certo aqui.
load_dotenv(BASE_DIR / ".env", override=True)

import os  # noqa: E402


def env(key: str, default=None):
    return os.environ.get(key, default)


def env_bool(key: str, default: bool = False) -> bool:
    value = os.environ.get(key)
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


def env_list(key: str, default: str = "") -> list[str]:
    value = os.environ.get(key, default)
    return [item.strip() for item in value.split(",") if item.strip()]


SECRET_KEY = env("DJANGO_SECRET_KEY", "django-insecure-change-me")

DEBUG = False

ALLOWED_HOSTS: list[str] = env_list("DJANGO_ALLOWED_HOSTS")

# Application definition
# No django.contrib.admin on purpose: the project ships its own admin panel
# in the Angular frontend, so the Django admin site is never installed/mounted.
DJANGO_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
]

LOCAL_APPS = [
    "apps.common",
    "apps.authentication",
    "apps.users",
    "apps.movies",
    "apps.games",
    "apps.rankings",
    "apps.achievements",
    "apps.advertisements",
    "apps.metrics",
    "apps.ai",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "shared.middleware.request_logging.RequestLoggingMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

AUTH_USER_MODEL = "users.User"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("DB_NAME", "cliched"),
        "USER": env("DB_USER", "cliched"),
        "PASSWORD": env("DB_PASSWORD", ""),
        "HOST": env("DB_HOST", "localhost"),
        "PORT": env("DB_PORT", "5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        # Regra explícita do usuário: senha precisa ter mais de 6 caracteres.
        "OPTIONS": {"min_length": 7},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "pt-br"
# "Hoje"/meia-noite do desafio diário (timezone.localdate() em
# DailyChallengeService) precisa bater com a meia-noite real do público
# (pt-br); UTC deixava o desafio virar 3h antes do contador do frontend
# chegar em 00:00:00 local.
TIME_ZONE = env("DJANGO_TIME_ZONE", "America/Sao_Paulo")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "static"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "shared.pagination.default.DefaultPageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
    "EXCEPTION_HANDLER": "shared.exceptions.handlers.custom_exception_handler",
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# drf-spectacular (OpenAPI / Swagger)
SPECTACULAR_SETTINGS = {
    "TITLE": "Cliched API",
    "DESCRIPTION": "API do Cliched: plataforma de jogos sobre cinema.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# Simple JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(env("JWT_ACCESS_MINUTES", 15))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(env("JWT_REFRESH_DAYS", 7))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# CORS
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")

# The anonymous daily-challenge session (apps.games) is identified via a
# custom X-Anon-Token header, and corsheaders' default allow-list doesn't
# include custom headers, so the browser's preflight rejects it and every
# guess after the token is issued fails client-side with "Failed to fetch".
CORS_ALLOW_HEADERS = [*default_headers, "x-anon-token"]

# Logging
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{asctime} {levelname} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
        "api_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "api.log",
            "maxBytes": 5 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "verbose",
        },
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "error.log",
            "maxBytes": 5 * 1024 * 1024,
            "backupCount": 5,
            "level": "ERROR",
            "formatter": "verbose",
        },
        "security_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "security.log",
            "maxBytes": 5 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {"handlers": ["console", "api_file"], "level": "INFO"},
        "django.request": {"handlers": ["error_file"], "level": "ERROR", "propagate": False},
        "django.security": {"handlers": ["security_file"], "level": "INFO", "propagate": False},
        "apps": {"handlers": ["console", "api_file"], "level": "INFO", "propagate": False},
    },
}

# API versioning prefix used in config/urls.py
API_VERSION = "v1"

# TMDB (The Movie Database) integration
TMDB_API_KEY = env("TMDB_API_KEY", "")
TMDB_READ_ACCESS_TOKEN = env("TMDB_READ_ACCESS_TOKEN", "")
TMDB_BASE_URL = env("TMDB_BASE_URL", "https://api.themoviedb.org/3")
# TMDB's own limit floats around 40 req/s; stay comfortably under it.
TMDB_MAX_REQUESTS_PER_SECOND = float(env("TMDB_MAX_REQUESTS_PER_SECOND", 40))

# URL do frontend Angular, usada pra montar o link de redefinição de senha
# enviado por e-mail (o backend não tem rota própria pra essa tela).
FRONTEND_URL = env("FRONTEND_URL", "http://localhost:4200")

# E-mail transacional (hoje só redefinição de senha). Sem credenciais no
# .env, cai pro console (dev) — nunca falha silenciosamente por falta de
# config, só imprime o e-mail no terminal. Mesmo padrão do TMDB acima:
# credenciais reais entram via .env quando existirem.
#
# Resend (https://resend.com): API HTTP, não SMTP — RESEND_API_KEY no
# .env troca o backend sozinho pro `ResendEmailBackend` (ver
# shared/email/backends/resend_backend.py), sem precisar dos campos
# EMAIL_HOST*/EMAIL_USE_TLS de SMTP, que só valem se algum dia trocar por
# um provedor SMTP de verdade. Sem domínio verificado na Resend, o único
# remetente que funciona é o de teste deles, `onboarding@resend.dev`
# (por isso é o default de RESEND_FROM_EMAIL).
RESEND_API_KEY = env("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = env("RESEND_FROM_EMAIL", "Cliched <onboarding@resend.dev>")

# Quanto tempo o link de redefinição de senha continua válido depois de
# enviado (usado por `django.contrib.auth.tokens.default_token_generator`,
# que embute a idade do token no hash). Pedido explícito: 2h, bem mais
# curto que o default do Django (3 dias) — link de e-mail é sensível,
# quanto menor a janela, menor o risco se o e-mail vazar.
PASSWORD_RESET_TIMEOUT = int(env("PASSWORD_RESET_TIMEOUT_SECONDS", 2 * 60 * 60))

# Rate limit do pedido de redefinição de senha: no máximo 1 e-mail a cada
# 30min por endereço (ver PasswordResetRequestView), evita alguém spamar
# a caixa de entrada de terceiros usando o formulário de "esqueci minha
# senha" como vetor de abuso.
PASSWORD_RESET_COOLDOWN_SECONDS = int(env("PASSWORD_RESET_COOLDOWN_SECONDS", 30 * 60))

if RESEND_API_KEY:
    EMAIL_BACKEND = "shared.email.backends.resend_backend.ResendEmailBackend"
else:
    EMAIL_BACKEND = env(
        "DJANGO_EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
    )
EMAIL_HOST = env("DJANGO_EMAIL_HOST", "")
EMAIL_PORT = int(env("DJANGO_EMAIL_PORT", 587))
EMAIL_HOST_USER = env("DJANGO_EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = env("DJANGO_EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("DJANGO_EMAIL_USE_TLS", True)
DEFAULT_FROM_EMAIL = env("DJANGO_DEFAULT_FROM_EMAIL", RESEND_FROM_EMAIL)
