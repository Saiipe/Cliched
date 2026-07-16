from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.serializers.register_serializer import RegisterSerializer
from apps.games.services.session_adoption_service import SessionAdoptionService
from apps.users.serializers.user_serializer import UserSerializer
from shared.responses.api_response import error_response, success_response

User = get_user_model()


def _tokens_for(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def _adopt_anon_progress(request, user) -> None:
    """Se o jogador vinha jogando anônimo (X-Anon-Token), o progresso passa
    a pertencer à conta — é o "salvar progresso ao logar"."""
    SessionAdoptionService.adopt(user, request.headers.get("X-Anon-Token"))


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Criar conta",
        description="Registra um usuário (com confirmação de senha e aceite dos "
        "termos) e retorna o par de tokens JWT. Se vier o header X-Anon-Token, o "
        "progresso anônimo é transferido para a conta.",
        request=RegisterSerializer,
        responses={201: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        tags=["auth"],
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Dados inválidos.", errors=serializer.errors, status=400
            )

        user = serializer.save()
        _adopt_anon_progress(request, user)
        return success_response(
            data={"user": UserSerializer(user).data, "tokens": _tokens_for(user)},
            message="Conta criada com sucesso.",
            status=201,
        )


class LoginView(APIView):
    """Login com e-mail OU nome de usuário no mesmo campo (`identifier`)."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Entrar",
        description="Autentica por e-mail ou nome de usuário e retorna o par de "
        "tokens JWT. Se vier o header X-Anon-Token, o progresso anônimo é "
        "transferido para a conta.",
        request=inline_serializer(
            name="LoginRequest",
            fields={
                "identifier": serializers.CharField(),
                "password": serializers.CharField(),
            },
        ),
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 401: OpenApiTypes.OBJECT},
        tags=["auth"],
    )
    def post(self, request):
        identifier = str(request.data.get("identifier") or "").strip()
        password = request.data.get("password") or ""
        if not identifier or not password:
            return error_response(
                message="Informe e-mail (ou nome de usuário) e senha.", status=400
            )

        username = identifier
        if "@" in identifier:
            match = User.objects.filter(email__iexact=identifier).first()
            username = match.username if match else identifier

        user = authenticate(request, username=username, password=password)
        if user is None:
            return error_response(message="Credenciais inválidas.", status=401)

        _adopt_anon_progress(request, user)
        return success_response(
            data={"user": UserSerializer(user).data, "tokens": _tokens_for(user)},
            message="Login efetuado.",
        )


class LogoutView(APIView):
    @extend_schema(
        summary="Sair",
        description="Invalida o refresh token (blacklist). O access token expira "
        "sozinho em minutos.",
        request=inline_serializer(
            name="LogoutRequest", fields={"refresh": serializers.CharField()}
        ),
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        tags=["auth"],
    )
    def post(self, request):
        try:
            RefreshToken(request.data.get("refresh")).blacklist()
        except TokenError:
            return error_response(message="Refresh token inválido.", status=400)
        return success_response(message="Sessão encerrada.")


class ChangePasswordView(APIView):
    @extend_schema(
        summary="Alterar senha",
        description="Troca a senha do usuário logado, validando a senha atual.",
        request=inline_serializer(
            name="ChangePasswordRequest",
            fields={
                "current_password": serializers.CharField(),
                "new_password": serializers.CharField(),
                "new_password_confirm": serializers.CharField(),
            },
        ),
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        tags=["auth"],
    )
    def post(self, request):
        current = request.data.get("current_password") or ""
        new = request.data.get("new_password") or ""
        confirm = request.data.get("new_password_confirm") or ""

        if not request.user.check_password(current):
            return error_response(message="Senha atual incorreta.", status=400)
        if new != confirm:
            return error_response(message="As novas senhas não conferem.", status=400)
        try:
            validate_password(new, user=request.user)
        except ValidationError as exc:
            return error_response(
                message="Nova senha fraca.", errors={"new_password": exc.messages}, status=400
            )

        request.user.set_password(new)
        request.user.save(update_fields=["password"])
        return success_response(message="Senha alterada com sucesso.")
