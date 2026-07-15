import json
import shutil
import tempfile
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.games.constants import MAX_ATTEMPTS
from apps.games.models import DailyChallenge, GameSession
from apps.movies.models import Movie

User = get_user_model()

ANSWER_TMDB_ID = 603
WRONG_TMDB_IDS = [100, 101, 102, 103, 104]


def tmdb_movie_payload(tmdb_id: int) -> dict:
    """Minimal TMDB movie+credits payload, varied per id so clues differ."""
    return {
        "id": tmdb_id,
        "title": f"Filme {tmdb_id}",
        "original_title": f"Movie {tmdb_id}",
        "release_date": f"{1990 + (tmdb_id % 30)}-01-01",
        "genres": [{"id": 28, "name": "Ação"}],
        "origin_country": ["US"],
        "runtime": 100 + (tmdb_id % 60),
        "poster_path": "/poster.jpg",
        "backdrop_path": "/backdrop.jpg",
        "popularity": 50.0,
        "credits": {
            "crew": [{"job": "Director", "name": f"Director {tmdb_id}"}],
            "cast": [
                {"id": tmdb_id * 10 + i, "name": f"Actor {tmdb_id}-{i}", "order": i}
                for i in range(5)
            ],
        },
    }


class DailyFlowTestsBase(APITestCase):
    def setUp(self):
        # Never touch the real dev media/ folder: PosterService is mocked in
        # most tests anyway, but any test that does write files (see
        # PosterAntiCheatTests) must do so under an isolated MEDIA_ROOT.
        self._media_root = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self._media_root, ignore_errors=True)
        override = override_settings(MEDIA_ROOT=self._media_root)
        override.enable()
        self.addCleanup(override.disable)

        patcher_posters = patch(
            "apps.games.services.daily_challenge_service.PosterService"
        )
        self.mock_poster_cls = patcher_posters.start()
        self.addCleanup(patcher_posters.stop)

        patcher_tmdb = patch(
            "apps.games.services.daily_challenge_service.TMDBService"
        )
        mock_tmdb_cls = patcher_tmdb.start()
        self.addCleanup(patcher_tmdb.stop)
        self.mock_tmdb = mock_tmdb_cls.return_value
        self.mock_tmdb.discover_movies.return_value = {
            "results": [{"id": ANSWER_TMDB_ID, "poster_path": "/x.jpg"}]
        }
        self.mock_tmdb.get_movie_with_credits.side_effect = (
            lambda tmdb_id, **kw: tmdb_movie_payload(tmdb_id)
        )
        self.mock_tmdb.get_movie.side_effect = (
            lambda tmdb_id, **kw: tmdb_movie_payload(tmdb_id)
        )
        self.mock_tmdb.get_movie_images.return_value = {
            "posters": [
                {"file_path": "/poster-alt-1.jpg", "vote_average": 5.8, "iso_639_1": "pt"},
                {"file_path": "/poster-alt-2.jpg", "vote_average": 5.2, "iso_639_1": None},
            ],
            "backdrops": [
                {"file_path": "/backdrop-alt-1.jpg", "vote_average": 6.1},
                {"file_path": "/backdrop-alt-2.jpg", "vote_average": 5.9},
            ],
        }

        # Guess syncing goes through a fresh MovieSyncService -> TMDBService.
        patcher_sync_tmdb = patch(
            "apps.movies.services.movie_sync_service.TMDBService"
        )
        mock_sync_cls = patcher_sync_tmdb.start()
        self.addCleanup(patcher_sync_tmdb.stop)
        mock_sync_cls.return_value.get_movie_with_credits.side_effect = (
            lambda tmdb_id, **kw: tmdb_movie_payload(tmdb_id)
        )

        # LocMemCache survives between tests; a cached challenge id from a
        # previous test would point at a row rolled back by the transaction.
        cache.clear()

    def get_daily(self, token=None):
        headers = {"HTTP_X_ANON_TOKEN": token} if token else {}
        return self.client.get("/api/v1/games/daily/", **headers)

    def post_guess(self, tmdb_id, token=None):
        headers = {"HTTP_X_ANON_TOKEN": token} if token else {}
        return self.client.post(
            "/api/v1/games/daily/guess/", {"tmdb_id": tmdb_id}, **headers
        )

    def assert_no_answer_leak(self, response):
        body = json.dumps(response.json())
        self.assertNotIn(str(ANSWER_TMDB_ID), body.replace("Filme", ""))
        self.assertNotIn(f"Filme {ANSWER_TMDB_ID}", body)


class AnonymousFlowTests(DailyFlowTestsBase):
    def test_get_creates_challenge_lazily(self):
        response = self.get_daily()
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["status"], "playing")
        self.assertEqual(data["attempts_used"], 0)
        self.assertEqual(data["poster_level"], 0)
        self.assertIsNone(data["reveal"])
        self.assertEqual(DailyChallenge.objects.count(), 1)
        self.assert_no_answer_leak(response)

    def test_first_guess_issues_anon_token_and_reuses_session(self):
        response = self.post_guess(WRONG_TMDB_IDS[0])
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        token = data["anon_token"]
        self.assertFalse(data["correct"])
        self.assertEqual(data["attempts_used"], 1)
        self.assertEqual(data["poster_level"], 1)
        self.assertEqual(data["score"], 900)
        self.assert_no_answer_leak(response)

        response2 = self.post_guess(WRONG_TMDB_IDS[1], token=token)
        data2 = response2.json()["data"]
        self.assertEqual(data2["attempts_used"], 2)
        self.assertNotIn("anon_token", data2)
        self.assertEqual(GameSession.objects.count(), 1)

    def test_five_wrong_guesses_lose_and_reveal(self):
        token = None
        for i, tmdb_id in enumerate(WRONG_TMDB_IDS):
            response = self.post_guess(tmdb_id, token=token)
            data = response.json()["data"]
            token = data.get("anon_token", token)
            if i < MAX_ATTEMPTS - 1:
                self.assertEqual(data["status"], "playing")
                self.assertIsNone(data["reveal"])
                self.assert_no_answer_leak(response)

        self.assertEqual(data["status"], "lost")
        self.assertEqual(data["score"], 0)
        self.assertEqual(data["poster_level"], 5)
        self.assertEqual(data["reveal"]["tmdb_id"], ANSWER_TMDB_ID)

        response = self.post_guess(ANSWER_TMDB_ID, token=token)
        self.assertEqual(response.status_code, 422)

    def test_correct_guess_wins(self):
        response = self.post_guess(ANSWER_TMDB_ID)
        data = response.json()["data"]
        self.assertTrue(data["correct"])
        self.assertEqual(data["status"], "won")
        self.assertEqual(data["score"], 1000)
        self.assertEqual(data["poster_level"], 5)
        self.assertEqual(data["reveal"]["tmdb_id"], ANSWER_TMDB_ID)

    def test_repeated_guess_rejected(self):
        response = self.post_guess(WRONG_TMDB_IDS[0])
        token = response.json()["data"]["anon_token"]
        response2 = self.post_guess(WRONG_TMDB_IDS[0], token=token)
        self.assertEqual(response2.status_code, 422)

    def test_invalid_tmdb_id_rejected(self):
        response = self.post_guess("abc")
        self.assertEqual(response.status_code, 400)

    def test_get_rebuilds_board_from_frozen_clues(self):
        response = self.post_guess(WRONG_TMDB_IDS[0])
        token = response.json()["data"]["anon_token"]
        response2 = self.get_daily(token=token)
        data = response2.json()["data"]
        self.assertEqual(len(data["previous_guesses"]), 1)
        self.assertIn("clues", data["previous_guesses"][0])
        self.assert_no_answer_leak(response2)


class AuthenticatedFlowTests(DailyFlowTestsBase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username="player", password="senha-forte-123")
        self.client.force_authenticate(self.user)

    def test_single_session_per_user_per_day(self):
        self.post_guess(WRONG_TMDB_IDS[0])
        self.post_guess(WRONG_TMDB_IDS[1])
        self.assertEqual(GameSession.objects.filter(user=self.user).count(), 1)
        session = GameSession.objects.get(user=self.user)
        self.assertEqual(session.attempts_used, 2)
        self.assertEqual(session.score, 800)

    def test_history_lists_finished_sessions(self):
        self.post_guess(ANSWER_TMDB_ID)
        response = self.client.get("/api/v1/games/daily/history/")
        self.assertEqual(response.status_code, 200)
        results = response.json()["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["status"], "won")
        self.assertEqual(results[0]["movie"]["tmdb_id"], ANSWER_TMDB_ID)

    def test_history_hides_movie_of_running_game(self):
        self.post_guess(WRONG_TMDB_IDS[0])
        response = self.client.get("/api/v1/games/daily/history/")
        results = response.json()["results"]
        self.assertEqual(results[0]["status"], "playing")
        self.assertIsNone(results[0]["movie"])

    def test_history_requires_auth(self):
        self.client.force_authenticate(None)
        response = self.client.get("/api/v1/games/daily/history/")
        self.assertEqual(response.status_code, 401)


class PosterAntiCheatTests(DailyFlowTestsBase):
    def test_locked_level_returns_403(self):
        self.get_daily()  # create challenge
        response = self.client.get("/api/v1/games/daily/poster/?level=5")
        self.assertEqual(response.status_code, 403)

    def test_invalid_level_returns_400(self):
        self.get_daily()
        response = self.client.get("/api/v1/games/daily/poster/?level=9")
        self.assertEqual(response.status_code, 400)

    def test_unlocked_level_serves_file(self):
        from pathlib import Path

        from django.conf import settings

        response = self.post_guess(WRONG_TMDB_IDS[0])
        token = response.json()["data"]["anon_token"]

        # setUp already points MEDIA_ROOT at an isolated temp dir.
        challenge = DailyChallenge.objects.get()
        poster_dir = Path(settings.MEDIA_ROOT) / "posters" / "daily" / str(challenge.pk)
        poster_dir.mkdir(parents=True, exist_ok=True)
        (poster_dir / "level_1.jpg").write_bytes(b"\xff\xd8\xff\xd9")

        response = self.client.get(
            f"/api/v1/games/daily/poster/?level=1&token={token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Cache-Control"], "private, no-store")
