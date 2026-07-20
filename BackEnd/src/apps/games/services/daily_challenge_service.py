import logging
import random
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from io import BytesIO

import requests
from django.db import IntegrityError, transaction
from django.utils import timezone
from PIL import Image

from apps.games.models import DailyChallenge
from apps.games.repositories.challenge_repository import ChallengeRepository
from apps.games.services.poster_service import PosterService
from apps.movies.services.movie_sync_service import MovieSyncService
from apps.movies.services.tmdb_service import TMDBService
from shared.cache.cache_service import CacheService
from shared.exceptions.custom_exceptions import BusinessRuleViolation
from shared.services.http_client import RetryableAPIClient

logger = logging.getLogger("apps")

# TMDB não relaciona pôster com/sem texto a nenhuma "arte base" comum: são
# só entradas soltas na mesma lista, e frequentemente artes completamente
# diferentes (campanhas internacionais, releases alternativos). Pra achar o
# "mesmo pôster, só sem o texto" de verdade, comparamos visualmente via hash
# perceptual (aHash 8x8) contra o pôster que a busca mostrou — sem isso, o
# textless "melhor avaliado" do TMDB podia ser uma arte totalmente diferente.
#
# Filme popular pode ter dezenas de pôsteres (uma entrada por idioma). Baixar
# e comparar cada um sequencialmente deixava a galeria "carregando" por muito
# tempo — por isso o teto de candidatos, o paralelismo no download e o cache
# do hash (o arquivo do TMDB nunca muda, então o hash de um file_path é
# válido indefinidamente).
_THUMB_BASE_URL = "https://image.tmdb.org/t/p/w92"
_HASH_SIZE = 8
_MAX_RANKED_CANDIDATES = 20
_HASH_WORKERS = 8
_HASH_CACHE_TIMEOUT = 60 * 60 * 24 * 7
_HASH_CACHE_KEY_TEMPLATE = "poster_ahash:{file_path}"
_CACHE_MISS_SENTINEL = -1  # aHash real nunca é negativo (é sempre 0..2**64-1)

# discover/movie sorted by popularity with a vote-count floor keeps the pool
# limited to movies famous enough to be guessable (~15 pages ≈ 300 titles).
DISCOVER_MAX_PAGE = 15
DISCOVER_MIN_VOTES = 1000
SELECTION_RETRIES = 3

CACHE_KEY_TEMPLATE = "daily_challenge:{date}"
CACHE_TIMEOUT_SECONDS = 60 * 60  # challenge is immutable once ready


class DailyChallengeService:
    """Creates and fetches the shared daily challenge.

    Both the scheduled job (jobs/daily_game.py) and the lazy fallback in the
    GET endpoint call get_or_create_today(); the unique constraint on
    DailyChallenge.date makes concurrent creation safe."""

    def __init__(self, tmdb_service: TMDBService | None = None):
        self._tmdb = tmdb_service or TMDBService()
        self._sync = MovieSyncService(self._tmdb)
        self._posters = PosterService()

    def get_or_create_today(self) -> DailyChallenge:
        today = timezone.localdate()
        cache_key = CACHE_KEY_TEMPLATE.format(date=today)

        challenge_id = CacheService.get(cache_key)
        if challenge_id:
            challenge = ChallengeRepository.get_ready_by_date(today)
            if challenge:
                return challenge

        challenge = self.get_or_create_for(today)
        CacheService.set(cache_key, challenge.pk, timeout=CACHE_TIMEOUT_SECONDS)
        return challenge

    def get_or_create_for(self, day) -> DailyChallenge:
        challenge = ChallengeRepository.get_ready_by_date(day)
        if challenge is None:
            challenge = self._create_challenge(day)
        return challenge

    def swap_movie(self, challenge: DailyChallenge, tmdb_id: int | None = None) -> DailyChallenge:
        """Admin-only: replace the movie of a future challenge.

        Once the challenge's date arrives the game is live (players may have
        sessions against the current answer), so swapping is forbidden."""
        if challenge.date <= timezone.localdate():
            raise BusinessRuleViolation(
                "O desafio deste dia já está em andamento e não pode mais ser trocado."
            )

        if tmdb_id is not None:
            if tmdb_id == challenge.movie.tmdb_id:
                raise BusinessRuleViolation("Este já é o filme atual do desafio.")
            if tmdb_id in ChallengeRepository.used_tmdb_ids():
                raise BusinessRuleViolation("Este filme já foi usado em outro desafio.")
            movie = self._sync.sync_movie(tmdb_id)
            if not movie.poster_path:
                raise BusinessRuleViolation("Este filme não tem pôster no TMDB.")
        else:
            movie = self._pick_movie()

        challenge.movie = movie
        challenge.status = DailyChallenge.Status.PENDING
        # A new movie means the old art choice may not exist anymore, so pick a
        # fresh textless default (the admin can still override it).
        challenge.image_source = DailyChallenge.ImageSource.POSTER
        challenge.image_path = self._pick_default_image_path(movie)
        challenge.save(
            update_fields=["movie", "status", "image_source", "image_path", "updated_at"]
        )
        return self._finish_pending(challenge)

    def set_image(
        self, challenge: DailyChallenge, image_source: str, image_path: str = ""
    ) -> DailyChallenge:
        """Admin-only: pick which TMDB art the pixelated game image is
        generated from, either the movie's default poster/backdrop
        (`image_path` blank) or a specific one from its gallery. Same cutoff
        rule as swap_movie."""
        if challenge.date <= timezone.localdate():
            raise BusinessRuleViolation(
                "O desafio deste dia já está em andamento e não pode mais ser alterado."
            )
        if image_source not in DailyChallenge.ImageSource.values:
            raise BusinessRuleViolation("Imagem inválida: use 'poster' ou 'backdrop'.")

        if image_source == DailyChallenge.ImageSource.BACKDROP and not image_path:
            movie = self.ensure_backdrop(challenge.movie)
            if not movie.backdrop_path:
                raise BusinessRuleViolation("Este filme não tem banner (backdrop) no TMDB.")

        if challenge.image_source == image_source and challenge.image_path == image_path:
            return challenge

        challenge.image_source = image_source
        challenge.image_path = image_path
        challenge.status = DailyChallenge.Status.PENDING
        challenge.save(update_fields=["image_source", "image_path", "status", "updated_at"])
        return self._finish_pending(challenge)

    def ensure_backdrop(self, movie):
        """Backfills backdrop_path for movies synced before the field existed."""
        if not movie.backdrop_path:
            movie = self._sync.refresh_media(movie)
        return movie

    def get_image_gallery(self, challenge: DailyChallenge) -> dict:
        """Full poster gallery for the challenge's movie, straight from TMDB
        (not persisted, just a proxy like movies/search). `iso_639_1` lets
        the admin filter by language (`None` = textless art).

        Ordered by visual similarity ao pôster que a busca mostrou
        (`movie.poster_path`): sem isso, o primeiro item da lista (o que a
        tela do admin destaca por padrão, filtro "Sem texto") vinha na ordem
        crua do TMDB, que não tem nenhuma relação com o pôster original —
        podia ser uma arte completamente diferente."""
        payload = self._tmdb.get_movie_images(challenge.movie.tmdb_id)
        posters = payload.get("posters", [])
        ranked = self._rank_by_similarity(challenge.movie.poster_path, posters)
        return {
            "posters": [
                {
                    "file_path": p["file_path"],
                    "vote_average": p.get("vote_average", 0),
                    "iso_639_1": p.get("iso_639_1"),
                }
                for p in ranked
            ],
        }

    def _pick_default_image_path(self, movie) -> str:
        """Prefers a textless poster as the default game art: a poster with
        the title baked into the image would make guessing trivial. Among
        the textless options, picks the one visually closest to
        `movie.poster_path` (see `_rank_by_similarity`) instead of just the
        TMDB-highest-rated one, so the default doesn't jump to unrelated key
        art. Falls back to blank (movie.poster_path, TMDB's own default) if
        the movie has no textless option in its gallery."""
        try:
            payload = self._tmdb.get_movie_images(movie.tmdb_id)
        except requests.RequestException:
            return ""
        textless = [p for p in payload.get("posters", []) if p.get("iso_639_1") is None]
        if not textless:
            return ""
        ranked = self._rank_by_similarity(movie.poster_path, textless)
        return ranked[0]["file_path"]

    def _rank_by_similarity(self, reference_path: str, posters: list[dict]) -> list[dict]:
        """Orders `posters` by perceptual closeness to `reference_path`
        (usually `movie.poster_path`, the one shown at search time). Falls
        back to the original TMDB order (by `vote_average`) whenever the
        reference can't be hashed (network hiccup) — visual ranking is a
        nice-to-have, never a hard requirement for the gallery to work.

        Only the `_MAX_RANKED_CANDIDATES` highest-rated posters are actually
        hashed (in parallel, `_HASH_WORKERS` at a time): a popular movie can
        have dozens of poster entries, one per language TMDB has art for,
        and hashing every single one serially was making the gallery hang
        for a long time. The rest stay appended in their rating order."""
        if len(posters) <= 1:
            return posters

        by_rating = sorted(posters, key=lambda p: p.get("vote_average", 0), reverse=True)
        reference_hash = self._poster_hash(reference_path)
        if reference_hash is None:
            return by_rating

        to_rank, rest = by_rating[:_MAX_RANKED_CANDIDATES], by_rating[_MAX_RANKED_CANDIDATES:]
        with ThreadPoolExecutor(max_workers=_HASH_WORKERS) as pool:
            candidate_hashes = list(
                pool.map(self._poster_hash, [p["file_path"] for p in to_rank])
            )

        scored = []
        for poster, candidate_hash in zip(to_rank, candidate_hashes):
            distance = (
                bin(reference_hash ^ candidate_hash).count("1")
                if candidate_hash is not None
                else _HASH_SIZE * _HASH_SIZE  # pior distância possível: manda pro fim da lista
            )
            scored.append((distance, poster))
        scored.sort(key=lambda pair: pair[0])
        return [poster for _distance, poster in scored] + rest

    @staticmethod
    def _poster_hash(file_path: str) -> int | None:
        """Average hash (aHash) 8x8: reduz o pôster a um inteiro de 64 bits
        que captura o layout/luminosidade geral da imagem. Duas artes
        parecidas (mesma composição, com ou sem texto) ficam com poucos bits
        diferentes; artes diferentes ficam bem distantes. Comparado via
        distância de Hamming (`bin(a ^ b).count("1")`) em `_rank_by_similarity`.

        Cacheado por `file_path`: é um arquivo estático do TMDB, o mesmo
        caminho nunca muda de conteúdo, então não há razão pra baixar e
        recalcular de novo toda vez que a galeria for reaberta."""
        if not file_path:
            return None

        cache_key = _HASH_CACHE_KEY_TEMPLATE.format(file_path=file_path)
        cached = CacheService.get(cache_key)
        if cached is not None:
            return cached if cached != _CACHE_MISS_SENTINEL else None

        try:
            # max_retries=0 e timeout curto: isto é só um sinal de
            # ordenação "nice to have" pro admin, nunca deve deixar a
            # troca/criação de desafio lenta ou travada por causa de uma
            # falha de rede pontual no TMDB.
            client = RetryableAPIClient(base_url=_THUMB_BASE_URL, max_retries=0, timeout=3)
            response = client.get(file_path)
            image = (
                Image.open(BytesIO(response.content))
                .convert("L")
                .resize((_HASH_SIZE, _HASH_SIZE), Image.Resampling.LANCZOS)
            )
        except (requests.RequestException, OSError):
            # Cacheia a falha também (por menos tempo): evita bater de novo
            # no TMDB pra um poster que acabou de falhar, dentro da mesma
            # leva de requisições paralelas de uma galeria grande.
            CacheService.set(cache_key, _CACHE_MISS_SENTINEL, timeout=300)
            return None

        pixels = list(image.getdata())
        average = sum(pixels) / len(pixels)
        bits = "".join("1" if pixel >= average else "0" for pixel in pixels)
        result = int(bits, 2)
        CacheService.set(cache_key, result, timeout=_HASH_CACHE_TIMEOUT)
        return result

    def advance_to_next_challenge(self) -> DailyChallenge:
        """TEST-ONLY convenience: instantly makes tomorrow's (already-previewed)
        challenge become today's, without waiting for real midnight, for
        trying out the "next challenge" flow in the frontend. Deletes today's
        challenge and every session/attempt against it (cascade); this is a
        throwaway dev tool, not meant for production use."""
        today = timezone.localdate()
        tomorrow = today + timedelta(days=1)

        next_challenge = self.get_or_create_for(tomorrow)

        todays = ChallengeRepository.get_by_date(today)
        if todays:
            todays.delete()
        CacheService.delete(CACHE_KEY_TEMPLATE.format(date=today))

        next_challenge.date = today
        next_challenge.save(update_fields=["date", "updated_at"])
        return next_challenge

    def _create_challenge(self, day) -> DailyChallenge:
        stale = ChallengeRepository.get_by_date(day)
        if stale and stale.status == DailyChallenge.Status.FAILED:
            stale.delete()  # allow a fresh pick after a failed generation
        elif stale:
            return self._finish_pending(stale)

        movie = self._pick_movie()
        image_path = self._pick_default_image_path(movie)
        try:
            with transaction.atomic():
                challenge = ChallengeRepository.create(day, movie, image_path=image_path)
        except IntegrityError:
            # Another request created it between our check and the insert.
            existing = ChallengeRepository.get_by_date(day)
            if existing is None:
                raise
            return self._finish_pending(existing)

        return self._finish_pending(challenge)

    def _finish_pending(self, challenge: DailyChallenge) -> DailyChallenge:
        if challenge.status == DailyChallenge.Status.READY:
            return challenge
        try:
            self._posters.generate_levels(challenge)
        except Exception:
            logger.exception("Poster generation failed for challenge %s", challenge.pk)
            challenge.status = DailyChallenge.Status.FAILED
            challenge.save(update_fields=["status", "updated_at"])
            raise BusinessRuleViolation(
                "Não foi possível preparar o desafio de hoje. Tente novamente."
            )
        challenge.status = DailyChallenge.Status.READY
        challenge.save(update_fields=["status", "updated_at"])
        return challenge

    def _pick_movie(self):
        used = ChallengeRepository.used_tmdb_ids()
        for _ in range(SELECTION_RETRIES):
            page = random.randint(1, DISCOVER_MAX_PAGE)
            results = self._tmdb.discover_movies(
                page=page, **{"vote_count.gte": DISCOVER_MIN_VOTES}
            ).get("results", [])
            candidates = [
                item
                for item in results
                if item.get("poster_path") and item["id"] not in used
            ]
            if not candidates:
                continue
            choice = random.choice(candidates)
            movie = self._sync.sync_movie(choice["id"])
            if movie.poster_path:
                return movie
        raise BusinessRuleViolation("Não foi possível escolher um filme para hoje.")
