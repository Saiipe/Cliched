from datetime import timedelta

import requests
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.views import APIView

from apps.games.models import CastChallenge
from apps.games.services.cast_game_service import CastGameService
from shared.permissions.roles import IsAdmin
from shared.responses.api_response import error_response, success_response


def _cast_challenge_payload(challenge: CastChallenge) -> dict:
    """Full movie reveal: admin-only response, never player-facing."""
    movie = challenge.movie
    return {
        "challenge_id": challenge.pk,
        "date": str(challenge.date),
        "status": challenge.status,
        "swappable": challenge.date > timezone.localdate(),
        "movie": {
            "tmdb_id": movie.tmdb_id,
            "title": movie.title,
            "original_title": movie.original_title,
            "release_year": movie.release_year,
            "director": movie.director,
            "top_cast": [
                {"name": p["name"], "profile_path": p.get("profile_path", "")}
                for p in movie.top_cast
            ],
            "poster_path": movie.poster_path,
        },
    }


class CurrentCastChallengeAdminView(APIView):
    """Reveal today's (live) cast-game movie for the admin: read-only."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Elenco: ver o filme de hoje",
        description="Revela o filme do desafio de elenco ao vivo agora (cria se "
        "ainda não existir). Somente leitura, nunca pode ser trocado.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["games-admin"],
    )
    def get(self, request):
        service = CastGameService()
        try:
            challenge = service.get_or_create_today()
        except requests.RequestException:
            return error_response(message="TMDB indisponível no momento.", status=502)
        return success_response(data=_cast_challenge_payload(challenge))


class NextCastChallengeAdminView(APIView):
    """Preview tomorrow's cast-game challenge (creates it if missing)."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Elenco: ver o filme de amanhã",
        description="Pré-visualiza o desafio de elenco do dia seguinte (cria se "
        "não existir), revelando o filme.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["games-admin"],
    )
    def get(self, request):
        tomorrow = timezone.localdate() + timedelta(days=1)
        service = CastGameService()
        try:
            challenge = service.get_or_create_for(tomorrow)
        except requests.RequestException:
            return error_response(message="TMDB indisponível no momento.", status=502)
        return success_response(data=_cast_challenge_payload(challenge))


class SwapNextCastChallengeAdminView(APIView):
    """Swap tomorrow's cast-game movie: rejected once the day has started.

    Body: {"tmdb_id": <int>} for a specific movie, or empty for a new
    random pick."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Elenco: trocar o filme de amanhã",
        description="Troca o filme do desafio de elenco de amanhã, por um "
        "específico (`tmdb_id`) ou por um novo sorteio (corpo vazio). Recusado "
        "(422) quando o dia do desafio já começou, ou quando o filme não tem "
        "elenco/diretor suficiente pro jogo.",
        request=inline_serializer(
            name="CastSwapRequest",
            fields={"tmdb_id": serializers.IntegerField(min_value=1, required=False)},
        ),
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 422: OpenApiTypes.OBJECT},
        tags=["games-admin"],
    )
    def post(self, request):
        tmdb_id = request.data.get("tmdb_id")
        if tmdb_id is not None and (not isinstance(tmdb_id, int) or tmdb_id <= 0):
            return error_response(
                message="'tmdb_id' deve ser um inteiro positivo (ou omitido para sorteio).",
                status=400,
            )

        tomorrow = timezone.localdate() + timedelta(days=1)
        service = CastGameService()
        try:
            challenge = service.get_or_create_for(tomorrow)
            challenge = service.swap_movie(challenge, tmdb_id)
        except requests.RequestException:
            return error_response(message="TMDB indisponível no momento.", status=502)
        return success_response(
            data=_cast_challenge_payload(challenge), message="Filme do desafio de elenco trocado."
        )
