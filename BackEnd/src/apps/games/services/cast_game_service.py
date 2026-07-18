import logging
import random
import uuid

from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.games.constants import MAX_ATTEMPTS, WRONG_GUESS_PENALTY
from apps.games.models import CastChallenge, CastSession, DailyChallenge
from apps.movies.models import Movie
from apps.movies.services.movie_sync_service import MovieSyncService
from apps.movies.services.tmdb_service import TMDBService
from shared.cache.cache_service import CacheService
from shared.exceptions.custom_exceptions import BusinessRuleViolation

logger = logging.getLogger("apps")

DISCOVER_MAX_PAGE = 15
DISCOVER_MIN_VOTES = 1000
SELECTION_RETRIES = 3

CACHE_KEY_TEMPLATE = "cast_challenge:{date}"
CACHE_TIMEOUT_SECONDS = 60 * 60

# Revelação progressiva: começa só com o ator principal; cada erro revela o
# próximo nome do elenco. O diretor entra como reforço na reta final.
DIRECTOR_REVEAL_AT_ATTEMPTS = 3


class CastGameService:
    """Jogo "adivinhe pelo elenco": um filme por dia, o jogador vê o rosto e
    o nome do ator principal e, a cada erro, o próximo do elenco (e perto do
    fim, o diretor). O filme-resposta nunca aparece no payload enquanto a
    partida está em andamento."""

    def __init__(self, tmdb_service: TMDBService | None = None):
        self._tmdb = tmdb_service or TMDBService()
        self._sync = MovieSyncService(self._tmdb)

    # ---- challenge -------------------------------------------------------

    def get_or_create_today(self) -> CastChallenge:
        today = timezone.localdate()
        cache_key = CACHE_KEY_TEMPLATE.format(date=today)

        challenge_id = CacheService.get(cache_key)
        if challenge_id:
            challenge = self._ready_by_date(today)
            if challenge:
                return challenge

        challenge = self.get_or_create_for(today)
        CacheService.set(cache_key, challenge.pk, timeout=CACHE_TIMEOUT_SECONDS)
        return challenge

    def get_or_create_for(self, day) -> CastChallenge:
        challenge = self._ready_by_date(day)
        if challenge is None:
            challenge = self._create_challenge(day)
        return challenge

    def swap_movie(self, challenge: CastChallenge, tmdb_id: int | None = None) -> CastChallenge:
        """Admin-only: replace the movie of a future challenge. Once the
        challenge's date arrives the game is live (players may have
        sessions against the current answer), so swapping is forbidden."""
        if challenge.date <= timezone.localdate():
            raise BusinessRuleViolation(
                "O desafio deste dia já está em andamento e não pode mais ser trocado."
            )

        # De propósito não exclui o próprio filme atual do desafio: um
        # sorteio "aleatório" não deveria acabar recaindo na mesma resposta
        # de novo (mesmo comportamento do daily: ver DailyChallengeService).
        used = set(CastChallenge.objects.values_list("movie__tmdb_id", flat=True))
        used |= set(DailyChallenge.objects.values_list("movie__tmdb_id", flat=True))

        if tmdb_id is not None:
            if tmdb_id == challenge.movie.tmdb_id:
                raise BusinessRuleViolation("Este já é o filme atual do desafio.")
            if tmdb_id in used:
                raise BusinessRuleViolation(
                    "Este filme já foi usado no desafio diário ou no de elenco."
                )
            movie = self._sync.sync_movie(tmdb_id)
            movie = self._ensure_cast_photos(movie)
            if not self._playable(movie):
                raise BusinessRuleViolation(
                    "Este filme não tem elenco com fotos suficiente (ou diretor) no TMDB."
                )
        else:
            movie = self._pick_movie(exclude=used)

        challenge.movie = movie
        challenge.status = CastChallenge.Status.READY
        challenge.save(update_fields=["movie", "status", "updated_at"])
        return challenge

    @staticmethod
    def _ready_by_date(day) -> CastChallenge | None:
        return (
            CastChallenge.objects.select_related("movie")
            .filter(date=day, status=CastChallenge.Status.READY)
            .first()
        )

    def _create_challenge(self, day) -> CastChallenge:
        stale = CastChallenge.objects.filter(date=day).first()
        if stale and stale.status == CastChallenge.Status.FAILED:
            stale.delete()
        elif stale:
            return self._mark_ready(stale)

        movie = self._pick_movie()
        try:
            with transaction.atomic():
                challenge = CastChallenge.objects.create(date=day, movie=movie)
        except IntegrityError:
            existing = CastChallenge.objects.select_related("movie").filter(date=day).first()
            if existing is None:
                raise
            return self._mark_ready(existing)
        return self._mark_ready(challenge)

    @staticmethod
    def _mark_ready(challenge: CastChallenge) -> CastChallenge:
        if challenge.status != CastChallenge.Status.READY:
            challenge.status = CastChallenge.Status.READY
            challenge.save(update_fields=["status", "updated_at"])
        return challenge

    def _pick_movie(self, exclude: set[int] | None = None) -> Movie:
        # Nunca reusa um filme de outro desafio de elenco nem qualquer filme
        # já usado no desafio diário: um jogador que jogou o outro modo
        # saberia a resposta na hora.
        used = set(exclude) if exclude is not None else set(
            CastChallenge.objects.values_list("movie__tmdb_id", flat=True)
        )
        if exclude is None:
            used |= set(DailyChallenge.objects.values_list("movie__tmdb_id", flat=True))

        for _ in range(SELECTION_RETRIES):
            page = random.randint(1, DISCOVER_MAX_PAGE)
            results = self._tmdb.discover_movies(
                page=page, **{"vote_count.gte": DISCOVER_MIN_VOTES}
            ).get("results", [])
            candidates = [item for item in results if item["id"] not in used]
            if not candidates:
                continue
            choice = random.choice(candidates)
            movie = self._sync.sync_movie(choice["id"])
            movie = self._ensure_cast_photos(movie)
            # Sem elenco completo com foto o jogo fica injusto; tenta outro.
            if self._playable(movie):
                return movie
        raise BusinessRuleViolation("Não foi possível escolher um filme para hoje.")

    def _ensure_cast_photos(self, movie: Movie) -> Movie:
        """Filmes sincronizados antes de top_cast ter profile_path precisam
        de um refresh para o jogo mostrar os rostos."""
        if movie.top_cast and all("profile_path" in p for p in movie.top_cast):
            return movie
        return self._sync.refresh_cast(movie)

    @staticmethod
    def _playable(movie: Movie) -> bool:
        with_photo = [p for p in movie.top_cast if p.get("profile_path")]
        return len(with_photo) >= MAX_ATTEMPTS and bool(movie.director)

    # ---- state / guess ---------------------------------------------------

    def get_state(self, challenge: CastChallenge, user, anon_token) -> dict:
        session = self._resolve_session(challenge, user, anon_token)
        return self._state_payload(challenge, session)

    def submit_guess(self, challenge: CastChallenge, user, anon_token, tmdb_id: int) -> dict:
        session = self._resolve_session(challenge, user, anon_token)
        issued_token = None
        if session is None:
            if user is not None and user.is_authenticated:
                session = CastSession.objects.create(challenge=challenge, user=user)
            else:
                session = CastSession.objects.create(
                    challenge=challenge, anon_token=uuid.uuid4()
                )
                issued_token = str(session.anon_token)

        guess = self._sync.sync_movie(tmdb_id)

        with transaction.atomic():
            session = (
                CastSession.objects.select_for_update()
                .select_related("challenge__movie")
                .get(pk=session.pk)
            )
            self._validate_guess(session, guess)

            answer = session.challenge.movie
            is_correct = guess.tmdb_id == answer.tmdb_id

            session.attempts_used += 1
            session.guesses = [
                *session.guesses,
                {"tmdb_id": guess.tmdb_id, "title": guess.title, "is_correct": is_correct},
            ]
            if is_correct:
                session.status = CastSession.Status.WON
                session.finished_at = timezone.now()
            else:
                session.score = max(0, session.score - WRONG_GUESS_PENALTY)
                if session.attempts_used >= MAX_ATTEMPTS:
                    session.status = CastSession.Status.LOST
                    session.score = 0
                    session.finished_at = timezone.now()
            session.save()

        payload = self._state_payload(challenge, session)
        payload["correct"] = is_correct
        if issued_token:
            payload["anon_token"] = issued_token
        return payload

    # ---- helpers ---------------------------------------------------------

    @staticmethod
    def _resolve_session(challenge, user, anon_token) -> CastSession | None:
        if user is not None and user.is_authenticated:
            return CastSession.objects.filter(challenge=challenge, user=user).first()
        if anon_token:
            try:
                token = uuid.UUID(str(anon_token))
            except (ValueError, AttributeError, TypeError):
                return None
            return CastSession.objects.filter(challenge=challenge, anon_token=token).first()
        return None

    @staticmethod
    def _validate_guess(session: CastSession, guess: Movie) -> None:
        if session.status != CastSession.Status.PLAYING:
            raise BusinessRuleViolation("Esta partida já terminou.")
        if session.attempts_used >= MAX_ATTEMPTS:
            raise BusinessRuleViolation("Você já usou todas as tentativas.")
        if any(g["tmdb_id"] == guess.tmdb_id for g in session.guesses):
            raise BusinessRuleViolation("Você já tentou este filme nesta partida.")

    def _state_payload(self, challenge: CastChallenge, session: CastSession | None) -> dict:
        status = session.status if session else CastSession.Status.PLAYING
        attempts_used = session.attempts_used if session else 0
        finished = status in (CastSession.Status.WON, CastSession.Status.LOST)

        movie = challenge.movie
        cast_with_photo = [p for p in movie.top_cast if p.get("profile_path")]
        total_cast = len(cast_with_photo)

        if finished:
            revealed_count = total_cast
            director = movie.director
        else:
            revealed_count = min(attempts_used + 1, total_cast)
            director = (
                movie.director if attempts_used >= DIRECTOR_REVEAL_AT_ATTEMPTS else None
            )

        return {
            "challenge_id": challenge.pk,
            "date": str(challenge.date),
            "max_attempts": MAX_ATTEMPTS,
            "attempts_used": attempts_used,
            "attempts_remaining": MAX_ATTEMPTS - attempts_used,
            "status": status,
            "score": session.score if session else None,
            "cast": [
                {"name": p["name"], "profile_path": p["profile_path"]}
                for p in cast_with_photo[:revealed_count]
            ],
            "total_cast": total_cast,
            "director": director,
            "previous_guesses": session.guesses if session else [],
            "reveal": self._reveal(movie) if finished else None,
        }

    @staticmethod
    def _reveal(movie: Movie) -> dict:
        return {
            "tmdb_id": movie.tmdb_id,
            "title": movie.title,
            "original_title": movie.original_title,
            "release_year": movie.release_year,
            "director": movie.director,
            "poster_path": movie.poster_path,
        }
