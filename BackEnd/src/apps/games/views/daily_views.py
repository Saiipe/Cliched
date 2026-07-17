import requests
from django.http import FileResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.games.constants import POSTER_MAX_LEVEL
from apps.games.repositories.session_repository import SessionRepository
from apps.games.serializers.history_serializer import HistorySessionSerializer
from apps.games.services.daily_challenge_service import DailyChallengeService
from apps.games.services.game_service import GameService
from apps.games.services.poster_service import PosterService
from shared.pagination.default import DefaultPageNumberPagination
from shared.responses.api_response import error_response, success_response


def _anon_token(request) -> str | None:
    return request.headers.get("X-Anon-Token") or request.query_params.get("token")


ANON_TOKEN_HEADER = OpenApiParameter(
    name="X-Anon-Token",
    location=OpenApiParameter.HEADER,
    type=OpenApiTypes.UUID,
    required=False,
    description="Token opaco da sessão anônima (emitido no primeiro palpite). "
    "Ignorado quando autenticado via JWT.",
)


def _tmdb_error(exc):
    if isinstance(exc, requests.HTTPError):
        status_code = exc.response.status_code if exc.response is not None else 502
        if status_code == 429:
            return error_response(
                message="TMDB está limitando as requisições no momento. Tente novamente em instantes.",
                status=429,
            )
    return error_response(message="TMDB indisponível no momento.", status=502)


class DailyChallengeView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Desafio diário: estado atual",
        description="Retorna o desafio de hoje (criando-o se ainda não existir). "
        "Nunca expõe o filme-resposta enquanto a partida está em andamento.",
        parameters=[ANON_TOKEN_HEADER],
        responses={200: OpenApiTypes.OBJECT},
        tags=["games"],
    )
    def get(self, request):
        try:
            challenge = DailyChallengeService().get_or_create_today()
        except requests.RequestException as exc:
            return _tmdb_error(exc)

        data = GameService().get_state(challenge, request.user, _anon_token(request))
        return success_response(data=data)


class DailyGuessView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Enviar palpite",
        description="Avalia o palpite contra o filme do dia e retorna as pistas por "
        "campo. No primeiro palpite anônimo, devolve `anon_token`: envie-o nos "
        "próximos requests via header X-Anon-Token.",
        parameters=[ANON_TOKEN_HEADER],
        request=inline_serializer(
            name="GuessRequest",
            fields={"tmdb_id": serializers.IntegerField(min_value=1)},
        ),
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 422: OpenApiTypes.OBJECT},
        tags=["games"],
    )
    def post(self, request):
        tmdb_id = request.data.get("tmdb_id")
        if not isinstance(tmdb_id, int) or tmdb_id <= 0:
            return error_response(
                message="O campo 'tmdb_id' é obrigatório e deve ser um inteiro positivo.",
                status=400,
            )

        try:
            challenge = DailyChallengeService().get_or_create_today()
            data = GameService().submit_guess(
                challenge, request.user, _anon_token(request), tmdb_id
            )
        except requests.RequestException as exc:
            return _tmdb_error(exc)

        return success_response(data=data)


class DailyPosterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Pôster pixelizado",
        description="Serve o JPEG do nível pedido. 403 se o nível ainda não foi "
        "desbloqueado pela sessão (1 nível por erro; imagem limpa só no fim).",
        parameters=[
            ANON_TOKEN_HEADER,
            OpenApiParameter(name="level", type=OpenApiTypes.INT, required=True,
                             description="Nível de 0 (mais pixelizado) a 5 (original)."),
            OpenApiParameter(name="token", type=OpenApiTypes.UUID, required=False,
                             description="Alternativa ao header X-Anon-Token (para tags <img>)."),
        ],
        responses={(200, "image/jpeg"): OpenApiTypes.BINARY, 403: OpenApiTypes.OBJECT},
        tags=["games"],
    )
    def get(self, request):
        try:
            level = int(request.query_params.get("level", 0))
        except ValueError:
            return error_response(message="Nível inválido.", status=400)
        if not 0 <= level <= POSTER_MAX_LEVEL:
            return error_response(message="Nível inválido.", status=400)

        try:
            challenge = DailyChallengeService().get_or_create_today()
        except requests.RequestException as exc:
            return _tmdb_error(exc)

        if request.user.is_authenticated:
            session = SessionRepository.for_user(challenge, request.user)
        else:
            session = SessionRepository.for_anon_token(challenge, _anon_token(request))

        poster_service = PosterService()
        unlocked = poster_service.unlocked_level(session)
        if level > unlocked:
            return error_response(
                message="Este nível do pôster ainda não foi desbloqueado.", status=403
            )

        path = poster_service.poster_file(challenge, level)
        response = FileResponse(open(path, "rb"), content_type="image/jpeg")
        # Private: a shared cache must never serve the clear poster to others.
        response["Cache-Control"] = "private, no-store"
        return response


class DailyHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Histórico do usuário",
        description="Sessões do usuário autenticado, paginadas. O filme só aparece "
        "em partidas encerradas.",
        responses={200: HistorySessionSerializer(many=True)},
        tags=["games"],
    )
    def get(self, request):
        sessions = SessionRepository.finished_for_user(request.user)
        paginator = DefaultPageNumberPagination()
        page = paginator.paginate_queryset(sessions, request, view=self)
        serializer = HistorySessionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
