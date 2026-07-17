from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.games.models import DailyChallenge, GameSession
from apps.movies.models import Movie

User = get_user_model()


class AdminUsersApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", password="senha-forte-123", is_superuser=True
        )
        self.player = User.objects.create_user(username="player", password="senha-forte-123")

        movie = Movie.objects.create(tmdb_id=1, title="Filme", poster_path="/p.jpg")
        challenge = DailyChallenge.objects.create(movie=movie, date="2026-01-01")
        GameSession.objects.create(
            challenge=challenge, user=self.player, status=GameSession.Status.WON
        )

    def test_list_requires_admin(self):
        response = self.client.get("/api/v1/users/admin/")
        self.assertEqual(response.status_code, 401)

        self.client.force_authenticate(self.player)
        response = self.client.get("/api/v1/users/admin/")
        self.assertEqual(response.status_code, 403)

    def test_list_returns_users_with_stats(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/v1/users/admin/")
        self.assertEqual(response.status_code, 200)

        users = response.json()["data"]["users"]
        by_username = {u["username"]: u for u in users}
        self.assertEqual(by_username["player"]["total_wins"], 1)
        self.assertEqual(by_username["player"]["rank_position"], 1)
        self.assertEqual(by_username["admin"]["total_wins"], 0)
        self.assertNotIn("password", by_username["player"])

    def test_login_history_requires_admin(self):
        response = self.client.get(f"/api/v1/users/admin/{self.player.id}/logins/")
        self.assertEqual(response.status_code, 401)

    def test_login_records_event_and_history_reflects_it(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"identifier": "player", "password": "senha-forte-123"},
        )
        self.assertEqual(response.status_code, 200)

        self.client.force_authenticate(self.admin)
        history = self.client.get(f"/api/v1/users/admin/{self.player.id}/logins/")
        self.assertEqual(history.status_code, 200)
        self.assertEqual(len(history.json()["data"]["logins"]), 1)

        self.player.refresh_from_db()
        self.assertIsNotNone(self.player.last_login)
