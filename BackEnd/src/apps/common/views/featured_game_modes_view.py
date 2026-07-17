from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.common.services.featured_game_modes_service import FeaturedGameModesService
from shared.permissions.roles import IsAdmin
from shared.responses.api_response import error_response, success_response


class FeaturedGameModesView(APIView):
    """Which game modes are highlighted on the home page, in order.

    GET is public (the home page reads it directly); POST replaces the
    whole ordered list; used by the admin "Jogos" picker, admin-only."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [AllowAny()]

    @extend_schema(
        summary="Modos de jogo em destaque na Home",
        description="Lista os ids dos modos de jogo destacados na tela inicial, na "
        "ordem configurada pelo admin.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["common"],
    )
    def get(self, request):
        ids = FeaturedGameModesService().list_ids()
        return success_response(data={"game_mode_ids": ids})

    @extend_schema(
        summary="[Admin] Definir os destaques da Home",
        description="Substitui a lista completa de modos de jogo destacados na Home, "
        "na ordem enviada.",
        request=inline_serializer(
            name="SetFeaturedGameModesRequest",
            fields={"game_mode_ids": serializers.ListField(child=serializers.CharField())},
        ),
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        tags=["common"],
    )
    def post(self, request):
        game_mode_ids = request.data.get("game_mode_ids")
        if not isinstance(game_mode_ids, list) or not all(
            isinstance(item, str) for item in game_mode_ids
        ):
            return error_response(
                message="'game_mode_ids' deve ser uma lista de strings.", status=400
            )

        ids = FeaturedGameModesService().set_ids(game_mode_ids)
        return success_response(data={"game_mode_ids": ids}, message="Destaques atualizados.")
