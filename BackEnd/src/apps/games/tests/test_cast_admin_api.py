from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.games.models import CastChallenge
from apps.games.tests.test_daily_flow_api import tmdb_movie_payload

User = get_user_model()

ANSWER_TMDB_ID = 550
OTHER_TMDB_ID = 680


class CastAdminApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)

        patcher_tmdb = patch("apps.games.services.cast_game_service.TMDBService")
        mock_tmdb_cls = patcher_tmdb.start()
        self.addCleanup(patcher_tmdb.stop)
        self.mock_tmdb = mock_tmdb_cls.return_value
        self.mock_tmdb.discover_movies.return_value = {
            "results": [{"id": ANSWER_TMDB_ID, "poster_path": "/x.jpg"}]
        }
        self.mock_tmdb.get_movie_with_credits.side_effect = (
            lambda tmdb_id, **kw: tmdb_movie_payload(tmdb_id)
        )

        self.admin = User.objects.create_user(
            username="admin", password="senha-forte-123", is_superuser=True
        )
        self.client.force_authenticate(self.admin)

    def get_current(self):
        return self.client.get("/api/v1/games/cast/current/")

    def get_next(self):
        return self.client.get("/api/v1/games/cast/next/")

    def swap(self, tmdb_id=None):
        body = {} if tmdb_id is None else {"tmdb_id": tmdb_id}
        return self.client.post("/api/v1/games/cast/next/swap/", body)

    def test_get_current_reveals_todays_movie_and_is_not_swappable(self):
        response = self.get_current()
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["date"], str(timezone.localdate()))
        self.assertFalse(data["swappable"])
        self.assertEqual(data["movie"]["tmdb_id"], ANSWER_TMDB_ID)
        self.assertTrue(data["movie"]["top_cast"][0]["profile_path"])

    def test_get_next_creates_and_reveals_tomorrows_movie(self):
        response = self.get_next()
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        tomorrow = timezone.localdate() + timedelta(days=1)
        self.assertEqual(data["date"], str(tomorrow))
        self.assertTrue(data["swappable"])
        self.assertTrue(CastChallenge.objects.filter(date=tomorrow).exists())

    def test_swap_to_specific_movie(self):
        self.get_next()
        self.mock_tmdb.get_movie_with_credits.side_effect = (
            lambda tmdb_id, **kw: tmdb_movie_payload(tmdb_id)
        )
        response = self.swap(tmdb_id=OTHER_TMDB_ID)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["movie"]["tmdb_id"], OTHER_TMDB_ID)

    def test_swap_random_picks_unused_movie(self):
        self.get_next()
        self.mock_tmdb.discover_movies.return_value = {
            "results": [
                {"id": ANSWER_TMDB_ID, "poster_path": "/x.jpg"},
                {"id": OTHER_TMDB_ID, "poster_path": "/y.jpg"},
            ]
        }
        response = self.swap()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["movie"]["tmdb_id"], OTHER_TMDB_ID)

    def test_swap_rejects_same_movie(self):
        self.get_next()
        response = self.swap(tmdb_id=ANSWER_TMDB_ID)
        self.assertEqual(response.status_code, 422)

    def test_swap_invalid_tmdb_id(self):
        response = self.swap(tmdb_id=-1)
        self.assertEqual(response.status_code, 400)

    def test_swap_rejected_after_day_turned(self):
        from apps.games.services.cast_game_service import CastGameService
        from shared.exceptions.custom_exceptions import BusinessRuleViolation

        self.get_current()  # creates today's (already live) challenge
        todays = CastChallenge.objects.get(date=timezone.localdate())
        with self.assertRaises(BusinessRuleViolation):
            CastGameService().swap_movie(todays, OTHER_TMDB_ID)

    def test_swap_rejects_movie_already_used_in_daily_challenge(self):
        from apps.games.models import DailyChallenge
        from apps.movies.models import Movie

        self.get_next()
        movie = Movie.objects.create(
            tmdb_id=OTHER_TMDB_ID, title="Já no diário", poster_path="/p.jpg"
        )
        DailyChallenge.objects.create(movie=movie, date=timezone.localdate())
        response = self.swap(tmdb_id=OTHER_TMDB_ID)
        self.assertEqual(response.status_code, 422)
