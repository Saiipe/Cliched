"""Auditoria de controle de acesso (OWASP A01: Broken Access Control).

Toda rota que o painel `/admin` do frontend consome precisa recusar tanto
requisição anônima quanto de usuário comum (`is_superuser=False`). Este
teste é intencionalmente uma lista **completa e explícita** de endpoints,
não descobre rotas sozinho: assim, esquecer `permission_classes =
[IsAdmin]` numa view admin nova quebra este teste em vez de vazar em
produção sem ninguém notar. Regra permanente: toda rota admin nova
precisa entrar em ADMIN_ONLY_ROUTES (ver FrontEnd/.claude/historico/
Regras-do-Projeto.md)."""

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()

# (método, url, body) — body vazio serve pra todos porque a permissão é
# checada por APIView.initial() antes de qualquer validação de payload.
ADMIN_ONLY_ROUTES = [
    ("get", "/api/v1/games/daily/current/", None),
    ("get", "/api/v1/games/daily/next/", None),
    ("post", "/api/v1/games/daily/next/swap/", {}),
    ("post", "/api/v1/games/daily/next/image/", {}),
    ("get", "/api/v1/games/daily/next/image/gallery/", None),
    ("post", "/api/v1/games/daily/advance/", {}),
    ("get", "/api/v1/games/cast/current/", None),
    ("get", "/api/v1/games/cast/next/", None),
    ("post", "/api/v1/games/cast/next/swap/", {}),
    ("post", "/api/v1/common/featured-game-modes/", {"game_mode_ids": []}),
    ("get", "/api/v1/users/admin/", None),
    ("get", "/api/v1/users/admin/999999/logins/", None),
    ("post", "/api/v1/users/admin/999999/toggle-active/", {}),
]


class AdminRoutesRequireAuthTests(APITestCase):
    def setUp(self):
        self.player = User.objects.create_user(username="player", password="senha-forte-123")
        self.admin = User.objects.create_user(
            username="admin", password="senha-forte-123", is_superuser=True
        )

    def _call(self, method: str, url: str, body):
        client_method = getattr(self.client, method)
        return client_method(url, body) if body is not None else client_method(url)

    def test_every_admin_route_rejects_anonymous_request(self):
        self.client.force_authenticate(None)
        for method, url, body in ADMIN_ONLY_ROUTES:
            with self.subTest(method=method, url=url):
                response = self._call(method, url, body)
                self.assertEqual(
                    response.status_code,
                    401,
                    f"{method.upper()} {url} deveria recusar requisição anônima (401), "
                    f"devolveu {response.status_code}: falta autenticação nessa rota.",
                )

    def test_every_admin_route_rejects_non_admin_user(self):
        self.client.force_authenticate(self.player)
        for method, url, body in ADMIN_ONLY_ROUTES:
            with self.subTest(method=method, url=url):
                response = self._call(method, url, body)
                self.assertEqual(
                    response.status_code,
                    403,
                    f"{method.upper()} {url} deveria recusar usuário não-admin (403), "
                    f"devolveu {response.status_code}: checagem de is_superuser ausente.",
                )

    def test_every_admin_route_allows_admin_user(self):
        # Sanity check: garante que a lista acima não está bloqueando
        # admin de verdade (ou seja, o teste não passa "por acidente").
        self.client.force_authenticate(self.admin)
        for method, url, body in ADMIN_ONLY_ROUTES:
            with self.subTest(method=method, url=url):
                response = self._call(method, url, body)
                self.assertNotIn(
                    response.status_code,
                    (401, 403),
                    f"{method.upper()} {url} bloqueou um admin de verdade "
                    f"({response.status_code}).",
                )
