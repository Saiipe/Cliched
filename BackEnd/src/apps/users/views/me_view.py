from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.users.serializers.user_serializer import UserSerializer
from apps.users.services.streak_service import StreakService
from shared.responses.api_response import success_response


class MeView(APIView):
    """Perfil do usuário autenticado + estatísticas de progresso."""

    @extend_schema(
        summary="Meu perfil",
        description="Dados do usuário logado e a sequência atual de vitórias no "
        "desafio diário.",
        responses={200: OpenApiTypes.OBJECT, 401: OpenApiTypes.OBJECT},
        tags=["users"],
    )
    def get(self, request):
        return success_response(
            data={
                "user": UserSerializer(request.user).data,
                "stats": {"current_streak": StreakService.current_streak(request.user)},
            }
        )
