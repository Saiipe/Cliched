from datetime import timedelta

import requests
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.views import APIView

from apps.games.models import DailyChallenge
from apps.games.services.daily_challenge_service import DailyChallengeService
from shared.permissions.roles import IsAdmin
from shared.responses.api_response import error_response, success_response


def _challenge_payload(challenge: DailyChallenge) -> dict:
    """Full movie reveal — admin-only responses, never player-facing."""
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
            "genres": movie.genres,
            "origin_country": movie.origin_country,
            "director": movie.director,
            "top_cast": [a["name"] for a in movie.top_cast],
            "runtime": movie.runtime,
            "poster_path": movie.poster_path,
        },
    }


class NextChallengeAdminView(APIView):
    """Preview tomorrow's challenge one day ahead (creates it if missing)."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Ver o filme de amanhã",
        description="Pré-visualiza o desafio do dia seguinte (cria se não existir), "
        "revelando o filme. Somente staff.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["games-admin"],
    )
    def get(self, request):
        tomorrow = timezone.localdate() + timedelta(days=1)
        try:
            challenge = DailyChallengeService().get_or_create_for(tomorrow)
        except requests.RequestException:
            return error_response(message="TMDB indisponível no momento.", status=502)
        return success_response(data=_challenge_payload(challenge))


class SwapNextChallengeAdminView(APIView):
    """Swap tomorrow's movie — rejected once the challenge's day has started.

    Body: {"tmdb_id": <int>} for a specific movie, or empty for a new
    random pick."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Trocar o filme de amanhã",
        description="Troca o filme do desafio de amanhã — por um específico "
        "(`tmdb_id`) ou por um novo sorteio (corpo vazio). Recusado (422) quando o "
        "dia do desafio já começou.",
        request=inline_serializer(
            name="SwapRequest",
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
        service = DailyChallengeService()
        try:
            challenge = service.get_or_create_for(tomorrow)
            challenge = service.swap_movie(challenge, tmdb_id)
        except requests.RequestException:
            return error_response(message="TMDB indisponível no momento.", status=502)
        return success_response(
            data=_challenge_payload(challenge), message="Filme do desafio trocado."
        )
