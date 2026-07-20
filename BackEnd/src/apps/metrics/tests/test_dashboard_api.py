from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.games.models import DailyChallenge, GameSession
from apps.movies.models import Movie

User = get_user_model()


class AdminDashboardStatsApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", password="senha-forte-123", is_superuser=True
        )
        self.player = User.objects.create_user(username="player", password="senha-forte-123")
        self.client.force_authenticate(self.admin)

        movie = Movie.objects.create(tmdb_id=1, title="Filme")
        challenge = DailyChallenge.objects.create(movie=movie, date=timezone.localdate())
        GameSession.objects.create(
            challenge=challenge, user=self.player, status=GameSession.Status.WON
        )

    def test_returns_real_counts(self):
        response = self.client.get("/api/v1/metrics/dashboard/")
        self.assertEqual(response.status_code, 200)

        data = response.json()["data"]
        self.assertEqual(data["players_count"], 2)
        self.assertEqual(data["movies_count"], 1)
        self.assertEqual(data["matches_today"], 1)
        self.assertEqual(data["average_accuracy"], 100)
        self.assertEqual(len(data["matches_trend"]), 7)
        self.assertEqual(
            {item["label"] for item in data["game_modes_popularity"]},
            {"Desafio Diário", "Elenco"},
        )
