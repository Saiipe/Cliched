from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.games.models import DailyChallenge
from apps.games.tests.test_daily_flow_api import (
    ANSWER_TMDB_ID,
    DailyFlowTestsBase,
)

User = get_user_model()

OTHER_TMDB_ID = 550


class AdminNextChallengeTests(DailyFlowTestsBase):
    def setUp(self):
        super().setUp()
        self.admin = User.objects.create_user(
            username="admin", password="senha-forte-123", is_staff=True
        )
        self.client.force_authenticate(self.admin)

    def get_next(self):
        return self.client.get("/api/v1/games/daily/next/")

    def swap(self, tmdb_id=None):
        body = {} if tmdb_id is None else {"tmdb_id": tmdb_id}
        return self.client.post("/api/v1/games/daily/next/swap/", body)

    def test_requires_staff(self):
        player = User.objects.create_user(username="player", password="senha-forte-123")
        self.client.force_authenticate(player)
        self.assertEqual(self.get_next().status_code, 403)
        self.assertEqual(self.swap().status_code, 403)

    def test_get_next_creates_and_reveals_tomorrows_movie(self):
        response = self.get_next()
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        tomorrow = timezone.localdate() + timedelta(days=1)
        self.assertEqual(data["date"], str(tomorrow))
        self.assertTrue(data["swappable"])
        self.assertEqual(data["movie"]["tmdb_id"], ANSWER_TMDB_ID)
        self.assertTrue(DailyChallenge.objects.filter(date=tomorrow).exists())

    def test_swap_to_specific_movie(self):
        self.get_next()
        response = self.swap(tmdb_id=OTHER_TMDB_ID)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["movie"]["tmdb_id"], OTHER_TMDB_ID)

    def test_swap_random_picks_unused_movie(self):
        self.get_next()
        # Random pool must exclude the current movie, so offer another id.
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

    def test_swap_rejected_after_day_turned(self):
        # Once a challenge's date arrives (clock passed midnight), the game is
        # live and the service must refuse to change its movie.
        from apps.games.services.daily_challenge_service import DailyChallengeService
        from shared.exceptions.custom_exceptions import BusinessRuleViolation

        self.get_daily()  # creates today's challenge (already live)
        todays = DailyChallenge.objects.get(date=timezone.localdate())
        with self.assertRaises(BusinessRuleViolation):
            DailyChallengeService().swap_movie(todays, OTHER_TMDB_ID)

    def test_swap_invalid_tmdb_id(self):
        response = self.swap(tmdb_id=-1)
        self.assertEqual(response.status_code, 400)
