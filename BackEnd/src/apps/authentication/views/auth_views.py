from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.serializers.register_serializer import RegisterSerializer
from shared.responses.api_response import error_response, success_response


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Criar conta",
        description="Registra um usuário e retorna o par de tokens JWT.",
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
        refresh = RefreshToken.for_user(user)
        return success_response(
            data={
                "user": serializer.data,
                "tokens": {"access": str(refresh.access_token), "refresh": str(refresh)},
            },
            message="Conta criada com sucesso.",
            status=201,
        )
