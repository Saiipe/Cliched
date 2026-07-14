from django.db import transaction
from django.urls import reverse
from django.utils import timezone

from apps.games.constants import MAX_ATTEMPTS, WRONG_GUESS_PENALTY
from apps.games.models import DailyChallenge, GameSession, GuessAttempt
from apps.games.repositories.session_repository import SessionRepository
from apps.games.services.guess_evaluation_service import GuessEvaluationService
from apps.games.services.poster_service import PosterService
from apps.movies.models import Movie
from apps.movies.services.movie_sync_service import MovieSyncService
from shared.exceptions.custom_exceptions import BusinessRuleViolation


class GameService:
    """Orchestrates a player's run at the daily challenge.

    The answer movie is never present in any payload while status is
    "playing" — only the frozen clues and the reveal (post-game) expose
    movie data."""

    def __init__(self):
        self._posters = PosterService()

    # ---- state -----------------------------------------------------------

    def get_state(self, challenge: DailyChallenge, user, anon_token) -> dict:
        session = self._resolve_session(challenge, user, anon_token)
        return self._state_payload(challenge, session)

    # ---- guess -----------------------------------------------------------

    def submit_guess(self, challenge: DailyChallenge, user, anon_token, tmdb_id: int) -> dict:
        session = self._resolve_session(challenge, user, anon_token)
        issued_token = None
        if session is None:
            if user is not None and user.is_authenticated:
                session = SessionRepository.create_for_user(challenge, user)
            else:
                session = SessionRepository.create_anonymous(challenge)
                issued_token = str(session.anon_token)

        guess = MovieSyncService().sync_movie(tmdb_id)

        with transaction.atomic():
            session = SessionRepository.locked(session.pk)
            self._validate_guess(session, guess)

            answer = session.challenge.movie
            is_correct = guess.tmdb_id == answer.tmdb_id
            clues = {} if is_correct else GuessEvaluationService.evaluate(guess, answer)

            session.attempts_used += 1
            if is_correct:
                session.status = GameSession.Status.WON
                session.finished_at = timezone.now()
            else:
                session.score = max(0, session.score - WRONG_GUESS_PENALTY)
                if session.attempts_used >= MAX_ATTEMPTS:
                    session.status = GameSession.Status.LOST
                    session.score = 0
                    session.finished_at = timezone.now()
            session.save()

            GuessAttempt.objects.create(
                session=session,
                attempt_number=session.attempts_used,
                guessed_movie=guess,
                is_correct=is_correct,
                clues=clues,
            )

        payload = self._state_payload(challenge, session)
        payload["correct"] = is_correct
        payload["clues"] = clues
        if issued_token:
            payload["anon_token"] = issued_token
        return payload

    # ---- helpers ---------------------------------------------------------

    @staticmethod
    def _resolve_session(challenge, user, anon_token) -> GameSession | None:
        if user is not None and user.is_authenticated:
            return SessionRepository.for_user(challenge, user)
        if anon_token:
            return SessionRepository.for_anon_token(challenge, anon_token)
        return None

    @staticmethod
    def _validate_guess(session: GameSession, guess: Movie) -> None:
        if session.status != GameSession.Status.PLAYING:
            raise BusinessRuleViolation("Esta partida já terminou.")
        if session.attempts_used >= MAX_ATTEMPTS:
            raise BusinessRuleViolation("Você já usou todas as tentativas.")
        if session.attempts.filter(guessed_movie=guess).exists():
            raise BusinessRuleViolation("Você já tentou este filme nesta partida.")

    def _state_payload(self, challenge: DailyChallenge, session: GameSession | None) -> dict:
        level = self._posters.unlocked_level(session)
        status = session.status if session else GameSession.Status.PLAYING
        attempts_used = session.attempts_used if session else 0
        finished = status in (GameSession.Status.WON, GameSession.Status.LOST)

        poster_url = f"{reverse('games:daily-poster')}?level={level}"

        payload = {
            "challenge_id": challenge.pk,
            "date": str(challenge.date),
            "max_attempts": MAX_ATTEMPTS,
            "attempts_used": attempts_used,
            "attempts_remaining": MAX_ATTEMPTS - attempts_used,
            "status": status,
            "score": session.score if session else None,
            "poster_level": level,
            "poster_url": poster_url,
            "title_hint": self._title_hint(challenge.movie),
            "previous_guesses": self._previous_guesses(session),
            "reveal": self._reveal(challenge.movie, level) if finished else None,
        }
        return payload

    @staticmethod
    def _title_hint(movie: Movie) -> dict:
        words = movie.title.split()
        return {"length": len(movie.title.replace(" ", "")), "word_count": len(words)}

    @staticmethod
    def _previous_guesses(session: GameSession | None) -> list[dict]:
        if session is None:
            return []
        return [
            {
                "attempt_number": attempt.attempt_number,
                "title": attempt.guessed_movie.title,
                "is_correct": attempt.is_correct,
                "clues": attempt.clues,
            }
            for attempt in session.attempts.select_related("guessed_movie")
        ]

    @staticmethod
    def _reveal(movie: Movie, level: int) -> dict:
        return {
            "tmdb_id": movie.tmdb_id,
            "title": movie.title,
            "original_title": movie.original_title,
            "release_year": movie.release_year,
            "genres": movie.genres,
            "origin_country": movie.origin_country,
            "director": movie.director,
            "top_cast": [a["name"] for a in movie.top_cast],
            "runtime": movie.runtime,
            "poster_url": f"{reverse('games:daily-poster')}?level={level}",
        }
