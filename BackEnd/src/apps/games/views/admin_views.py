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
        "image_source": challenge.image_source,
        "image_path": challenge.image_path,
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
            "backdrop_path": movie.backdrop_path,
        },
    }


class CurrentChallengeAdminView(APIView):
    """Reveal today's (live) movie for the admin — read-only, since a
    challenge that already started can never be swapped/edited."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Ver o filme de hoje",
        description="Revela o filme do desafio que está ao vivo agora (cria se "
        "ainda não existir). Somente leitura — nunca pode ser trocado.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["games-admin"],
    )
    def get(self, request):
        service = DailyChallengeService()
        try:
            challenge = service.get_or_create_today()
        except requests.RequestException:
            return error_response(message="TMDB indisponível no momento.", status=502)
        return success_response(data=_challenge_payload(challenge))


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
        service = DailyChallengeService()
        try:
            challenge = service.get_or_create_for(tomorrow)
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


class NextChallengeImageAdminView(APIView):
    """Choose which TMDB art tomorrow's pixelated game image is generated
    from — the movie's default poster/backdrop, or a specific one from its
    gallery (see NextChallengeImageGalleryAdminView).

    Body: {"image_source": "poster" | "backdrop", "image_path": <optional>}."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Escolher a imagem do desafio de amanhã",
        description="Define a imagem pixelizada do jogo — pôster/banner padrão do "
        "filme, ou uma arte específica da galeria (`image_path`) — e regenera os "
        "níveis. Recusado (422) quando o dia do desafio já começou.",
        request=inline_serializer(
            name="ImageSourceRequest",
            fields={
                "image_source": serializers.ChoiceField(
                    choices=DailyChallenge.ImageSource.values
                ),
                "image_path": serializers.CharField(required=False, allow_blank=True),
            },
        ),
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 422: OpenApiTypes.OBJECT},
        tags=["games-admin"],
    )
    def post(self, request):
        image_source = request.data.get("image_source")
        image_path = request.data.get("image_path") or ""
        if image_source not in DailyChallenge.ImageSource.values:
            return error_response(
                message="'image_source' deve ser 'poster' ou 'backdrop'.", status=400
            )
        if image_path and not isinstance(image_path, str):
            return error_response(message="'image_path' deve ser uma string.", status=400)

        tomorrow = timezone.localdate() + timedelta(days=1)
        service = DailyChallengeService()
        try:
            challenge = service.get_or_create_for(tomorrow)
            challenge = service.set_image(challenge, image_source, image_path)
        except requests.RequestException:
            return error_response(message="TMDB indisponível no momento.", status=502)
        return success_response(
            data=_challenge_payload(challenge), message="Imagem do desafio atualizada."
        )


class NextChallengeImageGalleryAdminView(APIView):
    """All TMDB posters for tomorrow's movie — movie-details only exposes a
    single default one; this is the full pick-from gallery. Backdrops are
    intentionally left out — this game only ever shows posters."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Galeria de pôsteres do filme de amanhã",
        description="Lista todos os pôsteres do TMDB para o filme do desafio de "
        "amanhã, com idioma (`iso_639_1`) e nota (`vote_average`) para filtrar "
        "(não só o padrão único do movie-details).",
        responses={200: OpenApiTypes.OBJECT},
        tags=["games-admin"],
    )
    def get(self, request):
        tomorrow = timezone.localdate() + timedelta(days=1)
        service = DailyChallengeService()
        try:
            challenge = service.get_or_create_for(tomorrow)
            gallery = service.get_image_gallery(challenge)
        except requests.RequestException:
            return error_response(message="TMDB indisponível no momento.", status=502)
        return success_response(data=gallery)


class AdvanceChallengeAdminView(APIView):
    """TEST-ONLY: instantly turns tomorrow's (already-previewed) challenge
    into today's, without waiting for real midnight. Remove this endpoint
    once the frontend no longer needs to fast-forward for manual testing."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin/Teste] Adiantar para o próximo desafio",
        description="Ferramenta temporária de teste: torna o desafio de amanhã o "
        "de hoje imediatamente, apagando o desafio atual e suas sessões. Não usar "
        "em produção.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["games-admin"],
    )
    def post(self, request):
        service = DailyChallengeService()
        try:
            challenge = service.advance_to_next_challenge()
        except requests.RequestException:
            return error_response(message="TMDB indisponível no momento.", status=502)
        return success_response(
            data=_challenge_payload(challenge), message="Desafio adiantado para hoje."
        )
