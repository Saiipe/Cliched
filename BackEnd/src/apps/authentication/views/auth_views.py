from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.models import LoginEvent
from apps.authentication.serializers.register_serializer import RegisterSerializer
from apps.games.services.session_adoption_service import SessionAdoptionService
from apps.rankings.services.mock_rotation_service import MockPlayerRotationService
from apps.users.serializers.user_serializer import UserSerializer
from shared.responses.api_response import error_response, success_response
from shared.validators.common import validate_username_format

User = get_user_model()


def _tokens_for(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def _adopt_anon_progress(request, user) -> None:
    """Se o jogador vinha jogando anônimo (X-Anon-Token), o progresso passa
    a pertencer à conta: é o "salvar progresso ao logar"."""
    SessionAdoptionService.adopt(user, request.headers.get("X-Anon-Token"))


def _client_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _record_login(request, user) -> None:
    """Histórico de acesso exibido pro admin na tela de Usuários. Também
    atualiza `last_login`, pois não usamos `django.contrib.auth.login()` (é
    JWT, sem sessão), então esse update não acontece sozinho."""
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])
    LoginEvent.objects.create(user=user, ip_address=_client_ip(request))


class UsernameAvailabilityView(APIView):
    """Validador ajax do campo de usuário no cadastro.

    De propósito só devolve um booleano: nunca diz *por que* está
    indisponível (formato inválido vs. já existe): expor a regra de
    caracteres aceitos facilitaria testar o allowlist por tentativa e
    erro. `RegisterSerializer` continua sendo a validação de verdade."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Checar disponibilidade de nome de usuário",
        description="Usado pelo formulário de cadastro para validar o nome de "
        "usuário enquanto a pessoa digita (`?username=...`). Só informa se está "
        "disponível ou não.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["auth"],
    )
    def get(self, request):
        username = (request.query_params.get("username") or "").strip()
        available = bool(username) and _is_username_available(username)
        return success_response(data={"available": available})


def _is_username_available(username: str) -> bool:
    try:
        validate_username_format(username)
    except ValidationError:
        return False
    return not User.objects.filter(username__iexact=username).exists()


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
        MockPlayerRotationService.swap_if_collision(user.username)
        _adopt_anon_progress(request, user)
        _record_login(request, user)
        return success_response(
            data={"user": UserSerializer(user).data, "tokens": _tokens_for(user)},
            message="Conta criada com sucesso.",
            status=201,
        )


class LoginView(APIView):
    """Login só por e-mail (sem distinção de maiúsculas/minúsculas).

    Nome de usuário nunca autentica, só identifica o jogador dentro da
    aplicação (ranking, etc). O `authenticate()` do Django ainda usa o
    campo `username` internamente (é o `USERNAME_FIELD` do model), então
    o e-mail é resolvido pro username correspondente antes de chamar."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Entrar",
        description="Autentica por e-mail (case-insensitive) e retorna o par de "
        "tokens JWT. Se vier o header X-Anon-Token, o progresso anônimo é "
        "transferido para a conta.",
        request=inline_serializer(
            name="LoginRequest",
            fields={
                "email": serializers.CharField(),
                "password": serializers.CharField(),
            },
        ),
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 401: OpenApiTypes.OBJECT},
        tags=["auth"],
    )
    def post(self, request):
        email = str(request.data.get("email") or "").strip()
        password = request.data.get("password") or ""
        if not email or not password:
            return error_response(message="Informe e-mail e senha.", status=400)

        # Só chama authenticate() se um e-mail cadastrado bateu: repassar o
        # valor cru (que poderia coincidir com um `username` de verdade)
        # abriria login por nome de usuário pela porta dos fundos.
        match = User.objects.filter(email__iexact=email).first()
        if match is None:
            return error_response(message="Credenciais inválidas.", status=401)

        user = authenticate(request, username=match.username, password=password)
        if user is None:
            return error_response(message="Credenciais inválidas.", status=401)

        _adopt_anon_progress(request, user)
        _record_login(request, user)
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


_RESET_LINK_INVALID_MESSAGE = "Link de redefinição inválido ou expirado."


class PasswordResetRequestView(APIView):
    """Pede um link de redefinição de senha por e-mail.

    Sempre devolve a mesma mensagem de sucesso, exista ou não conta com
    aquele e-mail (mesma lógica de não vazar informação de
    `UsernameAvailabilityView`, adaptada aqui pra não revelar quais
    e-mails têm conta)."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Pedir redefinição de senha",
        description="Envia um link de redefinição para o e-mail informado, se "
        "existir uma conta ativa com ele. A resposta é sempre a mesma, para não "
        "revelar se o e-mail está cadastrado.",
        request=inline_serializer(
            name="PasswordResetRequest", fields={"email": serializers.CharField()}
        ),
        responses={200: OpenApiTypes.OBJECT},
        tags=["auth"],
    )
    def post(self, request):
        email = str(request.data.get("email") or "").strip()
        user = User.objects.filter(email__iexact=email, is_active=True).first() if email else None

        # Rate limit por endereço, não por IP/usuário: o alvo do abuso é
        # a caixa de entrada de quem recebe, então a chave certa é o
        # e-mail (normalizado) mesmo sem conta encontrada — do contrário
        # um e-mail inexistente poderia ser usado pra pedir sem limite
        # (não muda a resposta, mas evita gastar cota da Resend à toa).
        cooldown_key = f"password-reset-cooldown:{email.lower()}"
        if email and cache.get(cooldown_key) is None:
            cache.set(cooldown_key, True, settings.PASSWORD_RESET_COOLDOWN_SECONDS)
            if user:
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                reset_link = f"{settings.FRONTEND_URL}/redefinir-senha?uid={uid}&token={token}"
                send_mail(
                    subject="Redefinição de senha — Cliched",
                    message=(
                        f"Olá, {user.username}!\n\n"
                        "Recebemos um pedido para redefinir a senha da sua conta no "
                        f"Cliched. Clique no link abaixo para escolher uma nova senha:\n\n"
                        f"{reset_link}\n\n"
                        "Se você não pediu isso, pode ignorar este e-mail."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    html_message=_password_reset_email_html(user.username, reset_link),
                    fail_silently=True,
                )
        # Sempre a mesma resposta: e-mail sem conta, e-mail em cooldown e
        # envio de verdade parecem idênticos de fora.
        return success_response(
            message="Se houver uma conta com esse e-mail, enviamos um link de redefinição."
        )


def _film_perforation_row() -> str:
    """Fileira de "furos de película" (mesmo motivo visual da faixa do
    `AuthModal`/`RevealModal` no frontend), em tabela pura pra renderizar
    de forma consistente em clientes de e-mail (sem flexbox/grid)."""
    cell = (
        '<td style="width:8%;padding:0 2px;">'
        '<div style="height:6px;border-radius:2px;background:rgba(11,11,15,0.35);"></div>'
        "</td>"
    )
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>{cell * 10}</tr></table>'


def _password_reset_email_html(username: str, reset_link: str) -> str:
    """Versão HTML do e-mail de redefinição, mesma identidade âmbar dos
    modais de auth do frontend (ver AuthModal/ResetPasswordPage): faixa
    gradiente com "furos de película" + emblema circular, num layout de
    tabelas (compatibilidade de clientes de e-mail não confia em
    flexbox/grid nem margin negativa)."""
    amber_gradient = "background:linear-gradient(135deg,#f59e0b,#f59e0b,rgba(245,158,11,0.75));"
    perforation_row = _film_perforation_row()
    return f"""\
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:32px 16px;background:#0b0b0f;
      font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
      <tr>
        <td style="text-align:center;padding-bottom:20px;">
          <span style="font-size:14px;font-weight:700;letter-spacing:0.12em;color:#f59e0b;text-transform:uppercase;">
            🎬&nbsp; Cliched
          </span>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
              style="background:#15151c;border:1px solid rgba(245,158,11,0.35);border-radius:24px;overflow:hidden;">
            <tr>
              <td bgcolor="#f59e0b" style="{amber_gradient}padding:10px 14px 0;">
                {perforation_row}
              </td>
            </tr>
            <tr>
              <td bgcolor="#f59e0b" style="{amber_gradient}text-align:center;padding:10px 0 20px;">
                <span style="display:inline-block;width:52px;height:52px;line-height:52px;
                    border-radius:16px;background:#15151c;border:3px solid #1c1c24;
                    font-size:24px;text-align:center;">🔑</span>
              </td>
            </tr>
            <tr>
              <td bgcolor="#f59e0b" style="{amber_gradient}padding:0 14px 10px;">
                {perforation_row}
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#e5e5e5;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.16em;
                    color:#f59e0b;text-transform:uppercase;">Redefinição de senha</p>
                <h1 style="margin:0 0 4px;font-size:22px;line-height:1.3;color:#fafafa;">
                  Olá, {username} 👋
                </h1>
                <p style="margin:8px 0 24px;color:#a1a1aa;font-size:14px;line-height:1.6;">
                  Recebemos um pedido para redefinir a senha da sua conta no
                  Cliched. Clique no botão abaixo pra escolher uma nova senha
                  e voltar pra sua sequência.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td bgcolor="#f59e0b" style="border-radius:12px;">
                      <a href="{reset_link}"
                         style="display:inline-block;padding:13px 28px;border-radius:12px;
                             background:#f59e0b;color:#0b0b0f;font-weight:700;
                             text-decoration:none;font-size:14px;">
                        🔓&nbsp; Escolher nova senha
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;color:#52525b;font-size:12px;line-height:1.6;">
                  O botão não funcionou? Copie e cole este link no navegador:<br />
                  <a href="{reset_link}" style="color:#f59e0b;word-break:break-all;">{reset_link}</a>
                </p>
                <p style="margin:20px 0 0;padding-top:16px;border-top:1px solid rgba(245,158,11,0.15);
                    color:#71717a;font-size:12px;line-height:1.6;">
                  🍿 Se você não pediu isso, pode ignorar este e-mail com
                  segurança, sua senha continua a mesma.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="text-align:center;padding-top:24px;">
          <p style="margin:0;color:#52525b;font-size:11px;line-height:1.6;">
            Cliched · Adivinhe o filme todos os dias<br />
            Este é um e-mail automático, não é preciso responder.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>"""


class PasswordResetConfirmView(APIView):
    """Confirma a redefinição a partir do link recebido por e-mail."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Confirmar redefinição de senha",
        description="Define a nova senha a partir do uid/token recebidos por "
        "e-mail (válidos por tempo limitado e de uso único).",
        request=inline_serializer(
            name="PasswordResetConfirmRequest",
            fields={
                "uid": serializers.CharField(),
                "token": serializers.CharField(),
                "new_password": serializers.CharField(),
                "new_password_confirm": serializers.CharField(),
            },
        ),
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        tags=["auth"],
    )
    def post(self, request):
        uid = request.data.get("uid") or ""
        token = request.data.get("token") or ""
        new = request.data.get("new_password") or ""
        confirm = request.data.get("new_password_confirm") or ""

        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)), is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return error_response(message=_RESET_LINK_INVALID_MESSAGE, status=400)

        if not default_token_generator.check_token(user, token):
            return error_response(message=_RESET_LINK_INVALID_MESSAGE, status=400)
        if new != confirm:
            return error_response(message="As senhas não conferem.", status=400)
        try:
            validate_password(new, user=user)
        except ValidationError as exc:
            return error_response(
                message="Senha fraca.", errors={"new_password": exc.messages}, status=400
            )

        user.set_password(new)
        user.save(update_fields=["password"])
        return success_response(message="Senha redefinida com sucesso.")
