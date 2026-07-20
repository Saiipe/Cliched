from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.metrics.services.dashboard_service import DashboardService
from shared.permissions.roles import IsAdmin
from shared.responses.api_response import success_response


class AdminDashboardStatsView(APIView):
    """[Admin] Números reais da plataforma pro dashboard: jogadores,
    catálogo, partidas de hoje, acerto médio, tendência de 7 dias e
    popularidade por modo de jogo."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Estatísticas do dashboard",
        description="Contagens e séries reais usadas no dashboard do painel admin.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["metrics-admin"],
    )
    def get(self, request):
        return success_response(data=DashboardService.get_stats())
