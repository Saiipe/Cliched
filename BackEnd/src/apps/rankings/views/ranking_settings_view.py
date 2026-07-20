from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.views import APIView

from apps.rankings.models import RankingSettings
from shared.permissions.roles import IsAdmin
from shared.responses.api_response import error_response, success_response


class RankingSettingsView(APIView):
    """[Admin] Liga/desliga a exibição de jogadores mockados no ranking."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Configurações do ranking",
        description="Estado atual do toggle de jogadores mockados no ranking.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["rankings-admin"],
    )
    def get(self, request):
        return success_response(data={"mocks_enabled": RankingSettings.current().mocks_enabled})

    @extend_schema(
        summary="[Admin] Ligar/desligar jogadores mockados",
        description="Liga ou desliga globalmente a exibição de `MockPlayer` no "
        "ranking público, sem precisar mexer em cada linha individualmente.",
        request=inline_serializer(
            name="SetRankingSettingsRequest",
            fields={"mocks_enabled": serializers.BooleanField()},
        ),
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        tags=["rankings-admin"],
    )
    def post(self, request):
        mocks_enabled = request.data.get("mocks_enabled")
        if not isinstance(mocks_enabled, bool):
            return error_response(
                message="'mocks_enabled' deve ser um booleano.", status=400
            )

        settings_obj = RankingSettings.current()
        settings_obj.mocks_enabled = mocks_enabled
        settings_obj.save(update_fields=["mocks_enabled"])
        return success_response(
            data={"mocks_enabled": settings_obj.mocks_enabled},
            message="Jogadores mockados ativados." if mocks_enabled else "Jogadores mockados desativados.",
        )
