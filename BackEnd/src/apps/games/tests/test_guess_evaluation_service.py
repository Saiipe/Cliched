from django.test import SimpleTestCase

from apps.games.services.guess_evaluation_service import GuessEvaluationService
from apps.movies.models import Movie


def make_movie(**overrides) -> Movie:
    fields = {
        "tmdb_id": 603,
        "title": "Matrix",
        "release_year": 1999,
        "genres": [{"id": 28, "name": "Ação"}, {"id": 878, "name": "Ficção"}],
        "origin_country": "US",
        "continent": "NA",
        "director": "Lana Wachowski",
        "top_cast": [
            {"id": 1, "name": "Keanu Reeves"},
            {"id": 2, "name": "Laurence Fishburne"},
            {"id": 3, "name": "Carrie-Anne Moss"},
            {"id": 4, "name": "Hugo Weaving"},
            {"id": 5, "name": "Gloria Foster"},
        ],
        "runtime": 136,
    }
    fields.update(overrides)
    return Movie(**fields)  # unsaved, in-memory only


class GuessEvaluationServiceTests(SimpleTestCase):
    def setUp(self):
        self.answer = make_movie()

    def evaluate(self, **guess_overrides):
        return GuessEvaluationService.evaluate(make_movie(**guess_overrides), self.answer)

    # release_year
    def test_year_correct(self):
        self.assertEqual(self.evaluate()["release_year"]["result"], "correct")

    def test_year_answer_is_newer(self):
        clue = self.evaluate(release_year=1990)["release_year"]
        self.assertEqual(clue["result"], "wrong")
        self.assertEqual(clue["direction"], "up")

    def test_year_answer_is_older(self):
        clue = self.evaluate(release_year=2010)["release_year"]
        self.assertEqual(clue["result"], "wrong")
        self.assertEqual(clue["direction"], "down")

    def test_year_missing_is_wrong_without_direction(self):
        clue = self.evaluate(release_year=None)["release_year"]
        self.assertEqual(clue["result"], "wrong")
        self.assertNotIn("direction", clue)

    # genres
    def test_genres_exact_set(self):
        clue = self.evaluate()["genres"]
        self.assertEqual(clue["result"], "correct")
        self.assertTrue(all(g["match"] == "green" for g in clue["value"]))

    def test_genres_partial_overlap(self):
        clue = self.evaluate(
            genres=[{"id": 28, "name": "Ação"}, {"id": 18, "name": "Drama"}]
        )["genres"]
        self.assertEqual(clue["result"], "partial")
        matches = {g["id"]: g["match"] for g in clue["value"]}
        self.assertEqual(matches, {28: "green", 18: "red"})

    def test_genres_no_overlap(self):
        clue = self.evaluate(genres=[{"id": 18, "name": "Drama"}])["genres"]
        self.assertEqual(clue["result"], "wrong")

    # country
    def test_country_correct(self):
        self.assertEqual(self.evaluate()["country"]["result"], "correct")

    def test_country_same_continent(self):
        clue = self.evaluate(origin_country="CA", continent="NA")["country"]
        self.assertEqual(clue["result"], "partial")
        self.assertEqual(clue["proximity"], "close")

    def test_country_different_continent(self):
        clue = self.evaluate(origin_country="JP", continent="AS")["country"]
        self.assertEqual(clue["result"], "wrong")
        self.assertEqual(clue["proximity"], "far")

    # director
    def test_director_match_is_case_insensitive(self):
        clue = self.evaluate(director="LANA WACHOWSKI")["director"]
        self.assertEqual(clue["result"], "correct")

    def test_director_mismatch(self):
        clue = self.evaluate(director="Christopher Nolan")["director"]
        self.assertEqual(clue["result"], "wrong")

    def test_director_empty_never_matches_empty(self):
        answer = make_movie(director="")
        clue = GuessEvaluationService.evaluate(make_movie(director=""), answer)["director"]
        self.assertEqual(clue["result"], "wrong")

    # cast
    def test_cast_all_shared(self):
        clue = self.evaluate()["cast"]
        self.assertEqual(clue["result"], "correct")
        self.assertEqual(clue["shared_count"], 5)

    def test_cast_partial(self):
        clue = self.evaluate(
            top_cast=[{"id": 1, "name": "Keanu Reeves"}, {"id": 99, "name": "Outro"}]
        )["cast"]
        self.assertEqual(clue["result"], "partial")
        self.assertEqual(clue["shared_count"], 1)

    def test_cast_none_shared(self):
        clue = self.evaluate(top_cast=[{"id": 99, "name": "Outro"}])["cast"]
        self.assertEqual(clue["result"], "wrong")
        self.assertEqual(clue["shared_count"], 0)

    # runtime
    def test_runtime_exact_match_is_correct_without_approximate_flag(self):
        clue = self.evaluate(runtime=136)["runtime"]
        self.assertEqual(clue["result"], "correct")
        self.assertNotIn("approximate", clue)
        self.assertNotIn("answer_value", clue)

    def test_runtime_within_tolerance_is_flagged_approximate_with_real_value(self):
        clue = self.evaluate(runtime=144)["runtime"]  # |144-136| = 8 <= 10
        self.assertEqual(clue["result"], "correct")
        self.assertTrue(clue["approximate"])
        self.assertEqual(clue["answer_value"], 136)

    def test_runtime_at_tolerance_boundary_is_correct(self):
        clue = self.evaluate(runtime=146)["runtime"]  # |146-136| = 10
        self.assertEqual(clue["result"], "correct")

    def test_runtime_just_outside_tolerance_is_partial(self):
        clue = self.evaluate(runtime=150)["runtime"]  # |150-136| = 14
        self.assertEqual(clue["result"], "partial")
        self.assertTrue(clue["approximate"])
        self.assertEqual(clue["answer_value"], 136)
        self.assertEqual(clue["direction"], "down")

    def test_runtime_at_partial_tolerance_boundary_is_partial(self):
        clue = self.evaluate(runtime=156)["runtime"]  # |156-136| = 20
        self.assertEqual(clue["result"], "partial")

    def test_runtime_just_outside_partial_tolerance_is_wrong(self):
        clue = self.evaluate(runtime=157)["runtime"]  # |157-136| = 21 > 20
        self.assertEqual(clue["result"], "wrong")
        self.assertNotIn("approximate", clue)
        self.assertNotIn("answer_value", clue)

    def test_runtime_answer_longer(self):
        clue = self.evaluate(runtime=100)["runtime"]  # diff 36 > 20
        self.assertEqual(clue["result"], "wrong")
        self.assertEqual(clue["direction"], "up")

    def test_runtime_answer_shorter(self):
        clue = self.evaluate(runtime=180)["runtime"]  # diff 44 > 20
        self.assertEqual(clue["result"], "wrong")
        self.assertEqual(clue["direction"], "down")

    def test_runtime_missing_is_wrong_without_direction(self):
        clue = self.evaluate(runtime=None)["runtime"]
        self.assertEqual(clue["result"], "wrong")
        self.assertNotIn("direction", clue)
