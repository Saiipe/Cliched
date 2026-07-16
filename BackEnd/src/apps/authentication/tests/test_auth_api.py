import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
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

    def login(self, identifier="player", password="senha-forte-123"):
        return self.client.post(
            "/api/v1/auth/login/", {"identifier": identifier, "password": password}
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

    def test_register_cannot_inject_admin_flags(self):
        # A flag de admin só muda direto no banco — payload malicioso com
        # is_staff/is_superuser/is_premium deve ser simplesmente ignorado.
        response = self.register(is_staff=True, is_superuser=True, is_premium=True)
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="player")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_premium)

    def test_login_with_username(self):
        self.register()
        response = self.login()
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertIn("access", data["tokens"])
        self.assertEqual(data["user"]["username"], "player")

    def test_login_with_email(self):
        self.register()
        response = self.login(identifier="player@example.com")
        self.assertEqual(response.status_code, 200)

    def test_login_wrong_password(self):
        self.register()
        response = self.login(password="errada")
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
        self.assertFalse(data["user"]["is_staff"])
        self.assertEqual(data["stats"]["current_streak"], 0)

    def test_me_requires_auth(self):
        response = self.client.get("/api/v1/users/me/")
        self.assertEqual(response.status_code, 401)


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
            {"identifier": "player", "password": "senha-forte-123"},
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
