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
            username="admin", password="senha-forte-123", is_superuser=True
        )
        self.client.force_authenticate(self.admin)

    def get_current(self):
        return self.client.get("/api/v1/games/daily/current/")

    def get_next(self):
        return self.client.get("/api/v1/games/daily/next/")

    def swap(self, tmdb_id=None):
        body = {} if tmdb_id is None else {"tmdb_id": tmdb_id}
        return self.client.post("/api/v1/games/daily/next/swap/", body)

    def set_image(self, image_source, image_path=None):
        body = {"image_source": image_source}
        if image_path is not None:
            body["image_path"] = image_path
        return self.client.post("/api/v1/games/daily/next/image/", body)

    def gallery(self):
        return self.client.get("/api/v1/games/daily/next/image/gallery/")

    def test_rejects_unauthenticated(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.get_next().status_code, 401)

    def test_rejects_non_admin_user(self):
        player = User.objects.create_user(username="player", password="senha-forte-123")
        self.client.force_authenticate(player)
        self.assertEqual(self.get_next().status_code, 403)

    def test_get_current_reveals_todays_movie_and_is_not_swappable(self):
        response = self.get_current()
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["date"], str(timezone.localdate()))
        self.assertFalse(data["swappable"])
        self.assertEqual(data["movie"]["tmdb_id"], ANSWER_TMDB_ID)

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

    def test_set_image_source_backdrop(self):
        self.get_next()
        response = self.set_image("backdrop")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["image_source"], "backdrop")
        self.assertEqual(data["movie"]["backdrop_path"], "/backdrop.jpg")

    def test_set_image_source_back_to_poster(self):
        self.get_next()
        self.set_image("backdrop")
        response = self.set_image("poster")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["image_source"], "poster")

    def test_set_image_source_invalid_value(self):
        self.get_next()
        response = self.set_image("gif")
        self.assertEqual(response.status_code, 400)

    def test_swap_resets_image_source_to_poster(self):
        self.get_next()
        self.set_image("backdrop")
        response = self.swap(tmdb_id=OTHER_TMDB_ID)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["image_source"], "poster")

    def test_gallery_lists_posters_only(self):
        self.get_next()
        response = self.gallery()
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(
            [p["file_path"] for p in data["posters"]], ["/poster-alt-1.jpg", "/poster-alt-2.jpg"]
        )
        self.assertEqual([p["iso_639_1"] for p in data["posters"]], ["pt", None])
        self.assertNotIn("backdrops", data)

    def test_set_image_with_specific_path_from_gallery(self):
        self.get_next()
        response = self.set_image("backdrop", image_path="/backdrop-alt-2.jpg")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["image_source"], "backdrop")
        self.assertEqual(data["image_path"], "/backdrop-alt-2.jpg")

    def test_swap_picks_a_fresh_textless_default(self):
        # A new movie's old art choice may not exist anymore — swap must
        # pick a new textless default rather than keep a stale image_path
        # or fall back to the (often title-text-covered) TMDB default.
        self.get_next()
        self.set_image("backdrop", image_path="/backdrop-alt-2.jpg")
        response = self.swap(tmdb_id=OTHER_TMDB_ID)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["image_source"], "poster")
        self.assertEqual(data["image_path"], "/poster-alt-2.jpg")

    def test_new_challenge_defaults_to_textless_poster(self):
        response = self.get_next()
        data = response.json()["data"]
        self.assertEqual(data["image_source"], "poster")
        self.assertEqual(data["image_path"], "/poster-alt-2.jpg")

    def test_advance_makes_tomorrow_todays_challenge(self):
        # Order matters for the mock: discover_movies only ever offers
        # ANSWER_TMDB_ID, so tomorrow must claim a *different* movie (via
        # explicit swap) before today's challenge is created — otherwise
        # both random picks compete for the same single candidate.
        self.get_next()  # creates tomorrow's challenge
        self.swap(tmdb_id=OTHER_TMDB_ID)  # give tomorrow a distinct movie
        self.get_daily()  # creates today's challenge, with a live session

        response = self.client.post("/api/v1/games/daily/advance/")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        today = timezone.localdate()
        self.assertEqual(data["date"], str(today))
        self.assertEqual(data["movie"]["tmdb_id"], OTHER_TMDB_ID)

        # Old today's challenge (and its session) is gone; the daily
        # endpoint now serves the advanced movie as a fresh session.
        self.assertEqual(DailyChallenge.objects.filter(date=today).count(), 1)
        daily_response = self.get_daily()
        self.assertEqual(daily_response.json()["data"]["attempts_used"], 0)
