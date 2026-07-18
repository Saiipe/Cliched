from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.users.services.admin_user_service import AdminUserService
from shared.permissions.roles import IsAdmin
from shared.responses.api_response import error_response, success_response

User = get_user_model()


class AdminUserListView(APIView):
    """Lista de usuários pro admin: perfil, último acesso, vitórias e
    sequências (atual e melhor) no desafio diário."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Listar usuários",
        description="Lista todos os usuários com último acesso, total de vitórias "
        "e sequências no desafio diário.",
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


class AdminUserToggleActiveView(APIView):
    """Ativa/inativa um usuário.

    Usuário inativo: não consegue mais logar (`ModelBackend` já recusa
    autenticação pra `is_active=False`), some do ranking (repositório de
    reais filtra por `user__is_active`) e não consegue reabrir conta
    própria (e-mail continua "em uso" pra novo cadastro). Não deixa o
    admin inativar a si mesmo, pra não se trancar fora do painel."""

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="[Admin] Ativar/inativar usuário",
        description="Alterna `is_active` do usuário. Um admin não pode inativar "
        "a própria conta.",
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        tags=["users-admin"],
    )
    def post(self, request, user_id):
        if request.user.id == user_id:
            return error_response(
                message="Você não pode inativar sua própria conta.", status=400
            )

        user = get_object_or_404(User, pk=user_id)
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return success_response(
            data={"id": user.id, "is_active": user.is_active},
            message="Usuário ativado." if user.is_active else "Usuário inativado.",
        )
