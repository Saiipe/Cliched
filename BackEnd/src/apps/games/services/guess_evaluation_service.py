"""Pure guess-vs-answer comparison. No I/O — the target of unit tests.

Each field yields {"result": "correct" | "partial" | "wrong", ...extras}.
Numeric fields add "direction": "up" when the answer is greater than the
guess (player should aim higher), "down" when smaller.
"""

from apps.games.constants import RUNTIME_TOLERANCE_MIN, TOP_CAST_N
from apps.movies.models import Movie

CORRECT = "correct"
PARTIAL = "partial"
WRONG = "wrong"


class GuessEvaluationService:
    @classmethod
    def evaluate(cls, guess: Movie, answer: Movie) -> dict:
        return {
            "release_year": cls._compare_year(guess, answer),
            "genres": cls._compare_genres(guess, answer),
            "country": cls._compare_country(guess, answer),
            "director": cls._compare_director(guess, answer),
            "cast": cls._compare_cast(guess, answer),
            "runtime": cls._compare_runtime(guess, answer),
        }

    @staticmethod
    def _compare_year(guess: Movie, answer: Movie) -> dict:
        clue = {"value": guess.release_year}
        if guess.release_year is None or answer.release_year is None:
            clue["result"] = WRONG
            return clue
        if guess.release_year == answer.release_year:
            clue["result"] = CORRECT
            return clue
        clue["result"] = WRONG
        clue["direction"] = "up" if answer.release_year > guess.release_year else "down"
        return clue

    @staticmethod
    def _compare_genres(guess: Movie, answer: Movie) -> dict:
        answer_ids = {g["id"] for g in answer.genres}
        guess_ids = {g["id"] for g in guess.genres}
        per_genre = [
            {**g, "match": "green" if g["id"] in answer_ids else "red"}
            for g in guess.genres
        ]
        if guess_ids and guess_ids == answer_ids:
            result = CORRECT
        elif guess_ids & answer_ids:
            result = PARTIAL
        else:
            result = WRONG
        return {"value": per_genre, "result": result}

    @staticmethod
    def _compare_country(guess: Movie, answer: Movie) -> dict:
        clue = {"value": guess.origin_country}
        if guess.origin_country and guess.origin_country == answer.origin_country:
            clue["result"] = CORRECT
        elif guess.continent and guess.continent == answer.continent:
            clue["result"] = PARTIAL
            clue["proximity"] = "close"
        else:
            clue["result"] = WRONG
            clue["proximity"] = "far"
        return clue

    @staticmethod
    def _compare_director(guess: Movie, answer: Movie) -> dict:
        matches = bool(guess.director) and guess.director.casefold() == answer.director.casefold()
        return {"value": guess.director, "result": CORRECT if matches else WRONG}

    @staticmethod
    def _compare_cast(guess: Movie, answer: Movie) -> dict:
        answer_ids = {a["id"] for a in answer.top_cast}
        shared = [a["name"] for a in guess.top_cast if a["id"] in answer_ids]
        count = len(shared)
        if count >= TOP_CAST_N:
            result = CORRECT
        elif count > 0:
            result = PARTIAL
        else:
            result = WRONG
        return {
            "value": [a["name"] for a in guess.top_cast],
            "shared_count": count,
            "result": result,
        }

    @staticmethod
    def _compare_runtime(guess: Movie, answer: Movie) -> dict:
        clue = {"value": guess.runtime}
        if guess.runtime is None or answer.runtime is None:
            clue["result"] = WRONG
            return clue
        if abs(guess.runtime - answer.runtime) <= RUNTIME_TOLERANCE_MIN:
            clue["result"] = CORRECT
            return clue
        clue["result"] = WRONG
        clue["direction"] = "up" if answer.runtime > guess.runtime else "down"
        return clue
