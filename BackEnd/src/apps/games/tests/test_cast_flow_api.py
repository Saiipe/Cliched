from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.games.constants import MAX_ATTEMPTS
from apps.games.models import CastChallenge, CastSession, DailyChallenge
from apps.games.tests.test_daily_flow_api import tmdb_movie_payload
from apps.movies.models import Movie

User = get_user_model()

ANSWER_TMDB_ID = 550
WRONG_TMDB_IDS = [200, 201, 202, 203, 204]


class CastFlowTests(APITestCase):
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

    def get_state(self, token=None):
        headers = {"HTTP_X_ANON_TOKEN": token} if token else {}
        return self.client.get("/api/v1/games/cast/", **headers)

    def guess(self, tmdb_id, token=None):
        headers = {"HTTP_X_ANON_TOKEN": token} if token else {}
        return self.client.post("/api/v1/games/cast/guess/", {"tmdb_id": tmdb_id}, **headers)

    def play_wrong(self, count, token=None):
        for i in range(count):
            response = self.guess(WRONG_TMDB_IDS[i], token=token)
            token = response.json()["data"].get("anon_token", token)
        return token

    def test_initial_state_reveals_only_principal_actor(self):
        response = self.get_state()
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(len(data["cast"]), 1)
        self.assertEqual(data["cast"][0]["name"], f"Actor {ANSWER_TMDB_ID}-0")
        self.assertTrue(data["cast"][0]["profile_path"])
        self.assertIsNone(data["director"])
        self.assertEqual(data["total_cast"], 5)
        self.assertIsNone(data["reveal"])

    def test_state_never_leaks_answer_while_playing(self):
        data = self.get_state().json()["data"]
        self.assertNotIn("movie", data)
        self.assertNotIn(f"Filme {ANSWER_TMDB_ID}", str(data))

    def test_wrong_guess_reveals_next_cast_member(self):
        response = self.guess(WRONG_TMDB_IDS[0])
        data = response.json()["data"]
        self.assertFalse(data["correct"])
        self.assertEqual(len(data["cast"]), 2)
        self.assertIsNone(data["director"])
        self.assertIn("anon_token", data)

    def test_director_revealed_late_game(self):
        token = self.play_wrong(3)
        data = self.get_state(token=token).json()["data"]
        self.assertEqual(data["attempts_used"], 3)
        self.assertEqual(data["director"], f"Director {ANSWER_TMDB_ID}")

    def test_win_reveals_movie(self):
        response = self.guess(ANSWER_TMDB_ID)
        data = response.json()["data"]
        self.assertTrue(data["correct"])
        self.assertEqual(data["status"], "won")
        self.assertEqual(data["reveal"]["title"], f"Filme {ANSWER_TMDB_ID}")
        self.assertEqual(len(data["cast"]), 5)

    def test_lose_after_max_attempts(self):
        token = self.play_wrong(MAX_ATTEMPTS)
        data = self.get_state(token=token).json()["data"]
        self.assertEqual(data["status"], "lost")
        self.assertEqual(data["score"], 0)
        self.assertIsNotNone(data["reveal"])

    def test_guess_after_finish_rejected(self):
        token = self.play_wrong(MAX_ATTEMPTS)
        response = self.guess(ANSWER_TMDB_ID, token=token)
        self.assertEqual(response.status_code, 422)

    def test_duplicate_guess_rejected(self):
        first = self.guess(WRONG_TMDB_IDS[0])
        token = first.json()["data"]["anon_token"]
        response = self.guess(WRONG_TMDB_IDS[0], token=token)
        self.assertEqual(response.status_code, 422)

    def test_anon_token_restores_session(self):
        token = self.play_wrong(2)
        data = self.get_state(token=token).json()["data"]
        self.assertEqual(data["attempts_used"], 2)
        self.assertEqual(len(data["cast"]), 3)

    def test_authenticated_session_without_token(self):
        user = User.objects.create_user(username="player", password="senha-forte-123")
        self.client.force_authenticate(user)
        self.guess(WRONG_TMDB_IDS[0])
        data = self.get_state().json()["data"]
        self.assertEqual(data["attempts_used"], 1)
        self.assertEqual(CastSession.objects.filter(user=user).count(), 1)

    def test_movie_pick_avoids_daily_movie(self):
        # O filme de hoje no desafio diário nunca pode ser a resposta do jogo
        # de elenco: quem jogou um modo saberia a resposta do outro.
        daily_movie = Movie.objects.create(
            tmdb_id=ANSWER_TMDB_ID, title="Já usado no diário", poster_path="/p.jpg"
        )
        DailyChallenge.objects.create(movie=daily_movie, date="2026-01-01")
        other_id = 777
        self.mock_tmdb.discover_movies.return_value = {
            "results": [
                {"id": ANSWER_TMDB_ID, "poster_path": "/x.jpg"},
                {"id": other_id, "poster_path": "/y.jpg"},
            ]
        }
        data = self.get_state().json()["data"]
        challenge = CastChallenge.objects.get(pk=data["challenge_id"])
        self.assertEqual(challenge.movie.tmdb_id, other_id)
