import requests
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.games.services.cast_game_service import CastGameService
from apps.games.views.daily_views import ANON_TOKEN_HEADER, _anon_token, _tmdb_error
from shared.responses.api_response import error_response, success_response


class CastChallengeView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Jogo de elenco: estado atual",
        description="Retorna o desafio de elenco de hoje (criando-o se ainda não "
        "existir): o ator principal revelado e, conforme os erros, os demais. "
        "Nunca expõe o filme-resposta enquanto a partida está em andamento.",
        parameters=[ANON_TOKEN_HEADER],
        responses={200: OpenApiTypes.OBJECT},
        tags=["games"],
    )
    def get(self, request):
        service = CastGameService()
        try:
            challenge = service.get_or_create_today()
        except requests.RequestException as exc:
            return _tmdb_error(exc)

        state = service.get_state(challenge, request.user, _anon_token(request))
        return success_response(data=state)


class CastGuessView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Jogo de elenco: enviar palpite",
        description="Registra um palpite. Errou? O próximo nome do elenco é "
        "revelado (e, na reta final, o diretor).",
        parameters=[ANON_TOKEN_HEADER],
        request=inline_serializer(
            name="CastGuessRequest",
            fields={"tmdb_id": serializers.IntegerField(min_value=1)},
        ),
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 422: OpenApiTypes.OBJECT},
        tags=["games"],
    )
    def post(self, request):
        tmdb_id = request.data.get("tmdb_id")
        if not isinstance(tmdb_id, int) or tmdb_id <= 0:
            return error_response(message="'tmdb_id' deve ser um inteiro positivo.", status=400)

        service = CastGameService()
        try:
            challenge = service.get_or_create_today()
            state = service.submit_guess(
                challenge, request.user, _anon_token(request), tmdb_id
            )
        except requests.RequestException as exc:
            return _tmdb_error(exc)
        return success_response(data=state)
