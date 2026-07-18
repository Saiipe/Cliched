from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.rankings.serializers.ranking_entry_serializer import RankingEntrySerializer
from apps.rankings.services.ranking_service import (
    DEFAULT_LIMIT,
    TYPE_COMBINED,
    VALID_TYPES,
    RankingService,
)
from apps.rankings.utils.periods import PERIOD_WEEK, VALID_PERIODS
from shared.responses.api_response import error_response, success_response


class RankingListView(APIView):
    """Ranking público de jogadores. Aberto a anônimos: é a vitrine da Home."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Ranking de jogadores",
        description="Top jogadores por sequência, pontos ou pontos + sequência, "
        "em janelas de semana (7 dias), mês (30 dias) ou geral.",
        parameters=[
            OpenApiParameter("type", str, enum=VALID_TYPES, default=TYPE_COMBINED),
            OpenApiParameter("period", str, enum=VALID_PERIODS, default=PERIOD_WEEK),
            OpenApiParameter("limit", int, default=DEFAULT_LIMIT),
        ],
        responses={200: RankingEntrySerializer(many=True), 400: OpenApiTypes.OBJECT},
        tags=["rankings"],
    )
    def get(self, request):
        ranking_type = request.query_params.get("type", TYPE_COMBINED)
        period = request.query_params.get("period", PERIOD_WEEK)
        try:
            limit = int(request.query_params.get("limit", DEFAULT_LIMIT))
        except ValueError:
            return error_response(message="limit deve ser um número inteiro.")

        try:
            entries = RankingService.get_ranking(ranking_type, period, limit)
        except ValueError as exc:
            return error_response(message=str(exc))

        return success_response(
            data={"type": ranking_type, "period": period, "entries": entries}
        )
