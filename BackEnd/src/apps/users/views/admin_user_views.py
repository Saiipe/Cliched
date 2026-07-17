from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.users.services.admin_user_service import AdminUserService
from shared.permissions.roles import IsAdmin
from shared.responses.api_response import success_response


class AdminUserListView(APIView):
    """Lista de usuários pro admin: perfil, último acesso, total de
    vitórias e posição calculada (por vitórias); não é um ranking
    persistido, só uma ordenação exibida na hora."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Listar usuários",
        description="Lista todos os usuários com último acesso, total de vitórias "
        "no desafio diário e posição calculada por vitórias.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["users-admin"],
    )
    def get(self, request):
        return success_response(data={"users": AdminUserService.list_with_stats()})


class AdminUserLoginHistoryView(APIView):
    """Histórico de acessos (logins) de um usuário específico."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Histórico de login de um usuário",
        description="Últimos logins do usuário (data/hora e IP), mais recente "
        "primeiro.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["users-admin"],
    )
    def get(self, request, user_id):
        return success_response(data={"logins": AdminUserService.login_history(user_id)})
