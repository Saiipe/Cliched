import uuid
from datetime import timedelta
from urllib.parse import parse_qs, urlparse

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.games.models import DailyChallenge, GameSession
from apps.movies.models import Movie

User = get_user_model()


class AuthAPITests(APITestCase):
    def register(self, **overrides):
        payload = {
            "username": "player",
            "email": "player@example.com",
            "password": "senha-forte-123",
            "password_confirm": "senha-forte-123",
            "accept_terms": True,
        }
        payload.update(overrides)
        return self.client.post("/api/v1/auth/register/", payload)

    def login(self, email="player@example.com", password="senha-forte-123"):
        return self.client.post(
            "/api/v1/auth/login/", {"email": email, "password": password}
        )

    def test_register_creates_user_and_returns_tokens(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)
        data = response.json()["data"]
        self.assertIn("access", data["tokens"])
        self.assertIn("refresh", data["tokens"])
        self.assertNotIn("password", data["user"])
        self.assertTrue(User.objects.filter(username="player").exists())

    def test_register_requires_accept_terms(self):
        response = self.register(accept_terms=False)
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.exists())

    def test_register_rejects_password_mismatch(self):
        response = self.register(password_confirm="outra-senha-123")
        self.assertEqual(response.status_code, 400)

    def test_register_rejects_weak_password(self):
        response = self.register(password="123", password_confirm="123")
        self.assertEqual(response.status_code, 400)

    def test_register_rejects_duplicate_email(self):
        self.register()
        response = self.register(username="other")
        self.assertEqual(response.status_code, 400)

    def test_username_available_for_new_valid_username(self):
        response = self.client.get(
            "/api/v1/auth/username-available/", {"username": "novoUsuario1"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["data"]["available"])

    def test_username_available_false_when_taken(self):
        self.register()
        response = self.client.get(
            "/api/v1/auth/username-available/", {"username": "player"}
        )
        self.assertFalse(response.json()["data"]["available"])

    def test_username_available_false_when_invalid_format(self):
        response = self.client.get(
            "/api/v1/auth/username-available/", {"username": "<teste>"}
        )
        self.assertFalse(response.json()["data"]["available"])

    def test_username_available_false_when_blank(self):
        response = self.client.get("/api/v1/auth/username-available/", {"username": ""})
        self.assertFalse(response.json()["data"]["available"])

    def test_username_available_does_not_reveal_rejection_reason(self):
        # Mesma resposta (só `available`) tanto pra formato inválido quanto
        # pra username já em uso: não deve haver nenhum outro campo (ex.:
        # "reason", "errors") que entregue a regra de caracteres aceitos.
        self.register()
        taken = self.client.get(
            "/api/v1/auth/username-available/", {"username": "player"}
        ).json()["data"]
        invalid = self.client.get(
            "/api/v1/auth/username-available/", {"username": "<teste>"}
        ).json()["data"]
        self.assertEqual(set(taken.keys()), {"available"})
        self.assertEqual(set(invalid.keys()), {"available"})

    def test_register_rejects_username_with_space(self):
        response = self.register(username="joao 12")
        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.json()["errors"])

    def test_register_rejects_username_with_angle_brackets(self):
        response = self.register(username="<teste>")
        self.assertEqual(response.status_code, 400)

    def test_register_rejects_username_with_quotes(self):
        response = self.register(username="'joao12")
        self.assertEqual(response.status_code, 400)

    def test_register_accepts_common_nickname_punctuation(self):
        # "T4uan" (o exemplo original do usuário) tem só 5 caracteres; com a
        # regra de "mais de 5 caracteres" adicionada depois, precisa de mais
        # um caractere pra ser válido.
        for username in ("T4uan1", "Jjuli$", "joab?!"):
            with self.subTest(username=username):
                response = self.register(
                    username=username, email=f"{username}@example.com"
                )
                self.assertEqual(response.status_code, 201)

    def test_register_rejects_username_with_five_characters_or_less(self):
        response = self.register(username="ab3$!")
        self.assertEqual(response.status_code, 400)

    def test_register_accepts_username_with_six_characters(self):
        response = self.register(username="ab3$!9")
        self.assertEqual(response.status_code, 201)

    def test_register_rejects_username_with_slash(self):
        response = self.register(username="joao/12")
        self.assertEqual(response.status_code, 400)

    def test_register_rejects_duplicate_username(self):
        self.register()
        response = self.register(email="outro@example.com")
        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.json()["errors"])

    def test_register_rejects_password_with_six_characters_or_less(self):
        response = self.register(password="ab3456", password_confirm="ab3456")
        self.assertEqual(response.status_code, 400)

    def test_register_accepts_password_with_seven_characters(self):
        response = self.register(password="ab34567", password_confirm="ab34567")
        self.assertEqual(response.status_code, 201)

    def test_register_cannot_inject_admin_flags(self):
        # A flag de admin só muda direto no banco: payload malicioso com
        # is_superuser/is_premium deve ser simplesmente ignorado.
        response = self.register(is_superuser=True, is_premium=True)
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="player")
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_premium)

    def test_login_with_email(self):
        self.register()
        response = self.login()
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertIn("access", data["tokens"])
        self.assertEqual(data["user"]["username"], "player")

    def test_login_is_case_insensitive_on_email(self):
        self.register()
        response = self.login(email="PLAYER@EXAMPLE.COM")
        self.assertEqual(response.status_code, 200)

    def test_login_rejects_username_instead_of_email(self):
        self.register()
        response = self.login(email="player")
        self.assertEqual(response.status_code, 401)

    def test_login_wrong_password(self):
        self.register()
        response = self.login(password="errada")
        self.assertEqual(response.status_code, 401)

    def test_login_rejects_inactive_user(self):
        self.register()
        user = User.objects.get(username="player")
        user.is_active = False
        user.save(update_fields=["is_active"])

        response = self.login()
        self.assertEqual(response.status_code, 401)

    def test_refresh(self):
        refresh_token = self.register().json()["data"]["tokens"]["refresh"]
        response = self.client.post("/api/v1/auth/refresh/", {"refresh": refresh_token})
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())

    def test_logout_blacklists_refresh_token(self):
        tokens = self.register().json()["data"]["tokens"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        response = self.client.post("/api/v1/auth/logout/", {"refresh": tokens["refresh"]})
        self.assertEqual(response.status_code, 200)

        reused = self.client.post("/api/v1/auth/refresh/", {"refresh": tokens["refresh"]})
        self.assertEqual(reused.status_code, 401)

    def test_change_password_flow(self):
        tokens = self.register().json()["data"]["tokens"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        wrong_current = self.client.post(
            "/api/v1/auth/change-password/",
            {
                "current_password": "errada",
                "new_password": "nova-senha-forte-456",
                "new_password_confirm": "nova-senha-forte-456",
            },
        )
        self.assertEqual(wrong_current.status_code, 400)

        mismatched = self.client.post(
            "/api/v1/auth/change-password/",
            {
                "current_password": "senha-forte-123",
                "new_password": "nova-senha-forte-456",
                "new_password_confirm": "diferente-789",
            },
        )
        self.assertEqual(mismatched.status_code, 400)

        ok = self.client.post(
            "/api/v1/auth/change-password/",
            {
                "current_password": "senha-forte-123",
                "new_password": "nova-senha-forte-456",
                "new_password_confirm": "nova-senha-forte-456",
            },
        )
        self.assertEqual(ok.status_code, 200)

        self.client.credentials()
        self.assertEqual(self.login(password="senha-forte-123").status_code, 401)
        self.assertEqual(self.login(password="nova-senha-forte-456").status_code, 200)

    def test_change_password_requires_auth(self):
        response = self.client.post("/api/v1/auth/change-password/", {})
        self.assertEqual(response.status_code, 401)

    def test_me_returns_profile_and_streak(self):
        tokens = self.register().json()["data"]["tokens"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        response = self.client.get("/api/v1/users/me/")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["user"]["username"], "player")
        self.assertFalse(data["user"]["is_superuser"])
        self.assertEqual(data["stats"]["current_streak"], 0)

    def test_me_requires_auth(self):
        response = self.client.get("/api/v1/users/me/")
        self.assertEqual(response.status_code, 401)


class PasswordResetTests(APITestCase):
    def setUp(self):
        # O rate limit do pedido de redefinição usa o cache (LocMemCache
        # em dev/test); sem limpar, um cooldown setado num teste vaza
        # pro próximo que use o mesmo e-mail.
        cache.clear()
        self.user = User.objects.create_user(
            username="player", email="player@example.com", password="senha-forte-123"
        )

    def _request_reset(self, email="player@example.com"):
        return self.client.post("/api/v1/auth/password-reset/", {"email": email})

    def _extract_link(self, mail_body: str) -> str:
        return next(line for line in mail_body.splitlines() if line.startswith("http"))

    def test_request_reset_sends_email_for_existing_user(self):
        response = self._request_reset()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.user.email, mail.outbox[0].to)

    def test_request_reset_is_case_insensitive(self):
        response = self._request_reset(email="PLAYER@EXAMPLE.COM")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)

    def test_request_reset_same_response_for_unknown_email(self):
        known = self._request_reset()
        mail.outbox.clear()
        unknown = self._request_reset(email="ninguem@example.com")

        self.assertEqual(known.status_code, unknown.status_code)
        self.assertEqual(known.json()["message"], unknown.json()["message"])
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(PASSWORD_RESET_COOLDOWN_SECONDS=1800)
    def test_second_request_within_cooldown_does_not_send_again(self):
        first = self._request_reset()
        second = self._request_reset()

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.json()["message"], first.json()["message"])
        self.assertEqual(len(mail.outbox), 1)

    @override_settings(PASSWORD_RESET_COOLDOWN_SECONDS=1800)
    def test_cooldown_is_per_email_not_global(self):
        User.objects.create_user(
            username="outro", email="outro@example.com", password="senha-forte-123"
        )

        self._request_reset(email="player@example.com")
        self._request_reset(email="outro@example.com")

        self.assertEqual(len(mail.outbox), 2)

    @override_settings(PASSWORD_RESET_COOLDOWN_SECONDS=0)
    def test_cooldown_zero_allows_immediate_resend(self):
        self._request_reset()
        self._request_reset()

        self.assertEqual(len(mail.outbox), 2)

    def test_password_reset_link_expires_in_two_hours_by_default(self):
        # Regressão de configuração: o token de redefinição usa
        # PASSWORD_RESET_TIMEOUT (django.contrib.auth.tokens) pra decidir
        # se expirou; pedido explícito foi 2h, bem menor que o default do
        # Django (3 dias).
        from django.conf import settings

        self.assertEqual(settings.PASSWORD_RESET_TIMEOUT, 2 * 60 * 60)

    def test_confirm_reset_changes_password(self):
        self._request_reset()
        link = self._extract_link(mail.outbox[0].body)
        query = parse_qs(urlparse(link).query)

        response = self.client.post(
            "/api/v1/auth/password-reset/confirm/",
            {
                "uid": query["uid"][0],
                "token": query["token"][0],
                "new_password": "nova-senha-forte-456",
                "new_password_confirm": "nova-senha-forte-456",
            },
        )
        self.assertEqual(response.status_code, 200)

        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "player@example.com", "password": "nova-senha-forte-456"},
        )
        self.assertEqual(login.status_code, 200)

    def test_confirm_reset_rejects_invalid_token(self):
        self._request_reset()
        link = self._extract_link(mail.outbox[0].body)
        query = parse_qs(urlparse(link).query)

        response = self.client.post(
            "/api/v1/auth/password-reset/confirm/",
            {
                "uid": query["uid"][0],
                "token": "token-invalido",
                "new_password": "nova-senha-forte-456",
                "new_password_confirm": "nova-senha-forte-456",
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_confirm_reset_rejects_password_mismatch(self):
        self._request_reset()
        link = self._extract_link(mail.outbox[0].body)
        query = parse_qs(urlparse(link).query)

        response = self.client.post(
            "/api/v1/auth/password-reset/confirm/",
            {
                "uid": query["uid"][0],
                "token": query["token"][0],
                "new_password": "nova-senha-forte-456",
                "new_password_confirm": "outra-coisa-789",
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_confirm_reset_token_is_single_use(self):
        self._request_reset()
        link = self._extract_link(mail.outbox[0].body)
        query = parse_qs(urlparse(link).query)
        payload = {
            "uid": query["uid"][0],
            "token": query["token"][0],
            "new_password": "nova-senha-forte-456",
            "new_password_confirm": "nova-senha-forte-456",
        }

        first = self.client.post("/api/v1/auth/password-reset/confirm/", payload)
        self.assertEqual(first.status_code, 200)

        second = self.client.post("/api/v1/auth/password-reset/confirm/", payload)
        self.assertEqual(second.status_code, 400)


class AnonAdoptionAndStreakTests(APITestCase):
    """Login adota a sessão anônima do dia, e /me contabiliza a sequência."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="player", email="player@example.com", password="senha-forte-123"
        )

    def _challenge(self, day):
        movie = Movie.objects.create(
            tmdb_id=1000 + day.toordinal(), title=f"Filme {day}", poster_path="/p.jpg"
        )
        return DailyChallenge.objects.create(
            date=day, movie=movie, status=DailyChallenge.Status.READY
        )

    def _login(self, anon_token=None):
        headers = {"X-Anon-Token": str(anon_token)} if anon_token else {}
        return self.client.post(
            "/api/v1/auth/login/",
            {"email": "player@example.com", "password": "senha-forte-123"},
            headers=headers,
        )

    def test_login_adopts_anon_session(self):
        challenge = self._challenge(timezone.localdate())
        token = uuid.uuid4()
        session = GameSession.objects.create(
            challenge=challenge,
            anon_token=token,
            status=GameSession.Status.WON,
            attempts_used=2,
        )

        response = self._login(anon_token=token)
        self.assertEqual(response.status_code, 200)

        session.refresh_from_db()
        self.assertEqual(session.user, self.user)
        self.assertIsNone(session.anon_token)

    def test_adoption_keeps_existing_user_session(self):
        challenge = self._challenge(timezone.localdate())
        mine = GameSession.objects.create(
            challenge=challenge, user=self.user, status=GameSession.Status.WON
        )
        token = uuid.uuid4()
        anon = GameSession.objects.create(challenge=challenge, anon_token=token)

        self._login(anon_token=token)

        anon.refresh_from_db()
        self.assertIsNone(anon.user)  # a sessão da conta prevalece
        mine.refresh_from_db()
        self.assertEqual(mine.user, self.user)

    def test_streak_counts_consecutive_won_days(self):
        today = timezone.localdate()
        for offset in (0, 1, 2, 4):  # buraco no dia -3 quebra a sequência em 3
            GameSession.objects.create(
                challenge=self._challenge(today - timedelta(days=offset)),
                user=self.user,
                status=GameSession.Status.WON,
            )

        access = self._login().json()["data"]["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get("/api/v1/users/me/")
        self.assertEqual(response.json()["data"]["stats"]["current_streak"], 3)

    def test_streak_alive_when_today_not_won_yet(self):
        today = timezone.localdate()
        for offset in (1, 2):
            GameSession.objects.create(
                challenge=self._challenge(today - timedelta(days=offset)),
                user=self.user,
                status=GameSession.Status.WON,
            )

        access = self._login().json()["data"]["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get("/api/v1/users/me/")
        self.assertEqual(response.json()["data"]["stats"]["current_streak"], 2)
