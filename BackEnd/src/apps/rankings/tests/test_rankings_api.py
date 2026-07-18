from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.games.models import DailyChallenge, GameSession
from apps.movies.models import Movie
from apps.rankings.mock_data.players import MOCK_PLAYERS
from apps.rankings.models import MockPlayer

User = get_user_model()


class RankingsApiTests(APITestCase):
    def setUp(self):
        # O serviço cacheia rankings; LocMemCache sobrevive entre testes.
        cache.clear()

    def _win_daily(self, user, days_ago: int, score: int):
        movie, _ = Movie.objects.get_or_create(tmdb_id=days_ago + 1, title="Filme")
        day = timezone.localdate() - timedelta(days=days_ago)
        challenge = DailyChallenge.objects.create(movie=movie, date=day)
        GameSession.objects.create(
            challenge=challenge,
            user=user,
            status=GameSession.Status.WON,
            score=score,
            finished_at=timezone.now() - timedelta(days=days_ago),
        )

    def test_ranking_is_public_and_seeded_with_mocks(self):
        response = self.client.get("/api/v1/rankings/")
        self.assertEqual(response.status_code, 200)

        data = response.json()["data"]
        self.assertEqual(data["type"], "combined")
        self.assertEqual(data["period"], "week")
        self.assertEqual(MockPlayer.objects.count(), len(MOCK_PLAYERS))
        self.assertGreater(len(data["entries"]), 0)
        self.assertFalse(any(entry["is_real"] for entry in data["entries"]))

    def test_only_ten_mocks_are_visible_at_a_time(self):
        self.assertEqual(MockPlayer.objects.filter(is_active=True).count(), 10)

        response = self.client.get("/api/v1/rankings/?type=points&period=all&limit=100")
        entries = response.json()["data"]["entries"]
        self.assertEqual(len(entries), 10)

    def test_top_mock_by_month_is_also_top_by_general(self):
        # "Fiel": quem lidera o mês precisa liderar o geral também, senão o
        # ranking parece incoerente entre períodos.
        month = self.client.get("/api/v1/rankings/?type=points&period=month&limit=1")
        overall = self.client.get("/api/v1/rankings/?type=points&period=all&limit=1")

        month_leader = month.json()["data"]["entries"][0]["player_name"]
        overall_leader = overall.json()["data"]["entries"][0]["player_name"]
        self.assertEqual(month_leader, overall_leader)

    def test_points_ranking_is_sorted_descending(self):
        response = self.client.get("/api/v1/rankings/?type=points&period=all&limit=100")
        entries = response.json()["data"]["entries"]

        points = [entry["points"] for entry in entries]
        self.assertEqual(points, sorted(points, reverse=True))
        self.assertEqual([e["position"] for e in entries], list(range(1, len(entries) + 1)))

    def test_streak_ranking_sorts_by_streak_then_points(self):
        response = self.client.get("/api/v1/rankings/?type=streak&period=all&limit=100")
        entries = response.json()["data"]["entries"]

        keys = [(-entry["streak"], -entry["points"]) for entry in entries]
        self.assertEqual(keys, sorted(keys))

    def test_real_user_enters_ranking_after_winning(self):
        player = User.objects.create_user(username="cinefilo", password="senha-forte-123")
        self._win_daily(player, days_ago=0, score=1000)
        self._win_daily(player, days_ago=1, score=900)

        response = self.client.get("/api/v1/rankings/?type=points&period=week&limit=100")
        entries = response.json()["data"]["entries"]
        real = [entry for entry in entries if entry["is_real"]]

        self.assertEqual(len(real), 1)
        self.assertEqual(real[0]["player_name"], "cinefilo")
        self.assertEqual(real[0]["points"], 1900)
        self.assertEqual(real[0]["streak"], 2)

    def test_week_window_excludes_old_wins(self):
        player = User.objects.create_user(username="veterano", password="senha-forte-123")
        self._win_daily(player, days_ago=20, score=1000)

        week = self.client.get("/api/v1/rankings/?type=points&period=week&limit=100")
        month = self.client.get("/api/v1/rankings/?type=points&period=month&limit=100")

        week_names = [e["player_name"] for e in week.json()["data"]["entries"]]
        month_names = [e["player_name"] for e in month.json()["data"]["entries"]]
        self.assertNotIn("veterano", week_names)
        self.assertIn("veterano", month_names)

    def test_inactive_user_excluded_from_ranking(self):
        player = User.objects.create_user(username="banido", password="senha-forte-123")
        self._win_daily(player, days_ago=0, score=1000)
        player.is_active = False
        player.save(update_fields=["is_active"])

        response = self.client.get("/api/v1/rankings/?type=points&period=all&limit=100")
        names = [e["player_name"] for e in response.json()["data"]["entries"]]
        self.assertNotIn("banido", names)

    def test_invalid_params_return_400(self):
        for query in ("?type=banana", "?period=ontem", "?limit=abc"):
            response = self.client.get(f"/api/v1/rankings/{query}")
            self.assertEqual(response.status_code, 400, query)

    def test_mock_seed_values_are_coherent(self):
        for player in MOCK_PLAYERS:
            name = player["display_name"]
            self.assertLessEqual(player["weekly_points"], player["monthly_points"], name)
            self.assertLessEqual(player["monthly_points"], player["total_points"], name)
            self.assertLessEqual(player["weekly_streak"], 7, name)
            self.assertLessEqual(player["monthly_streak"], 30, name)
            self.assertLessEqual(player["weekly_streak"], player["monthly_streak"], name)
            self.assertLessEqual(player["monthly_streak"], player["best_streak"], name)

    def test_mock_points_are_achievable_scores(self):
        # Cada sessão vencida vale INITIAL_SCORE menos um múltiplo de
        # WRONG_GUESS_PENALTY (ambos 100 em 100, ver apps.games.constants):
        # qualquer soma dessas parcelas é múltipla de 100. Um mock com
        # pontuação fora disso (ex.: 12840, 950) seria impossível de um
        # jogador de verdade alcançar.
        for player in MOCK_PLAYERS:
            name = player["display_name"]
            self.assertEqual(player["weekly_points"] % 100, 0, name)
            self.assertEqual(player["monthly_points"] % 100, 0, name)
            self.assertEqual(player["total_points"] % 100, 0, name)
