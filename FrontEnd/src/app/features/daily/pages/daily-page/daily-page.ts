import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Button } from '../../../../shared/ui/button/button';
import { GuessCluesGrid } from '../../components/guess-clues/guess-clues';
import { MovieAutocomplete } from '../../components/movie-autocomplete/movie-autocomplete';
import { NextChallengeCountdown } from '../../components/next-challenge-countdown/next-challenge-countdown';
import { PreviousGuessCard } from '../../components/previous-guess-card/previous-guess-card';
import type {
  ClueResult,
  DailyChallengeState,
  DailyPreviousGuess,
  DailyReveal,
  GuessClues,
  MovieSearchResult,
} from '../../models/daily-session.model';
import { DailyGameService } from '../../services/daily-game.service';

function hasClues(clues: GuessClues | Record<string, never>): clues is GuessClues {
  return Object.keys(clues).length > 0;
}

const RESULT_RANK: Record<ClueResult, number> = { correct: 2, partial: 1, wrong: 0 };

/** Uma vez que uma pista chega em "correct" ou "partial", ela fica travada
 * assim pro resto do jogo (não perde a informação já garantida por causa
 * de um palpite pior depois). Já uma pista "wrong" continua trocando pro
 * palpite mais recente: enquanto não acerta aquele campo, não faz sentido
 * travar no primeiro erro. */
function pickBetterClue<T extends { result: ClueResult }>(best: T, current: T): T {
  const bestRank = RESULT_RANK[best.result];
  const currentRank = RESULT_RANK[current.result];
  if (currentRank > bestRank) {
    return current;
  }
  if (currentRank < bestRank) {
    return best;
  }
  return bestRank === RESULT_RANK.wrong ? current : best;
}

function mergeBestClues(guesses: readonly GuessClues[]): GuessClues | null {
  if (guesses.length === 0) {
    return null;
  }
  return guesses.reduce((best, current) => ({
    release_year: pickBetterClue(best.release_year, current.release_year),
    genres: pickBetterClue(best.genres, current.genres),
    country: pickBetterClue(best.country, current.country),
    director: pickBetterClue(best.director, current.director),
    cast: pickBetterClue(best.cast, current.cast),
    runtime: pickBetterClue(best.runtime, current.runtime),
  }));
}

/** Quando o jogo termina (ganhou ou esgotou as tentativas), o backend só
 * manda a revelação, não pistas do palpite final. Monta as 6 pistas como
 * "correct" a partir do filme revelado, pra mostrar as informações certas
 * de verdade, mesmo numa derrota. */
function allCorrectClues(reveal: DailyReveal): GuessClues {
  return {
    release_year: { value: reveal.release_year, result: 'correct' },
    genres: {
      value: reveal.genres.map((genre) => ({ ...genre, match: 'green' })),
      result: 'correct',
    },
    country: { value: reveal.origin_country, result: 'correct' },
    director: { value: reveal.director, result: 'correct' },
    cast: { value: reveal.top_cast, shared_count: reveal.top_cast.length, result: 'correct' },
    runtime: { value: reveal.runtime, result: 'correct' },
  };
}

type SessionStatus = 'playing' | 'won' | 'lost';

const STATUS_LABEL: Record<SessionStatus, string> = {
  playing: 'Em andamento',
  won: 'Você venceu',
  lost: 'Você perdeu',
};

const STATUS_STYLES: Record<SessionStatus, string> = {
  playing: 'border-border bg-surface-elevated text-muted',
  won: 'border-success/40 bg-success/10 text-success',
  lost: 'border-error/30 bg-error/10 text-error',
};

@Component({
  selector: 'app-daily-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button,
    MovieAutocomplete,
    GuessCluesGrid,
    PreviousGuessCard,
    NextChallengeCountdown,
    NgTemplateOutlet,
  ],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-16">
      <div class="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <article class="rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.45)]">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.3em] text-muted">Desafio diário</p>
              <h1 class="mt-2 text-3xl font-bold text-foreground">Adivinhe o filme do dia</h1>
              <p class="mt-3 max-w-2xl text-sm text-muted">
                Descubra o filme por trás do pôster pixelado. A cada erro, uma pista nova é
                revelada e a imagem fica um pouco mais nítida.
              </p>
            </div>

            <span
              class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
              [class]="statusClass()"
            >
              {{ statusLabel() }}
            </span>
          </div>

          @if (loading()) {
            <p class="mt-8 text-sm text-muted">Carregando sessão...</p>
          } @else if (session(); as currentSession) {
            <div
              class="mt-8 grid gap-6"
              [class]="currentSession.image_source === 'backdrop' ? 'lg:grid-cols-1' : 'lg:grid-cols-[260px_1fr]'"
            >
              <div
                class="w-full overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-lg"
                [class]="posterWrapperClass(currentSession)"
              >
                @if (posterUrl(); as posterSrcValue) {
                  <img
                    class="h-full w-full object-cover"
                    [src]="posterSrcValue"
                    [alt]="'Pôster do desafio de ' + currentSession.date"
                  />
                }
              </div>

              <div class="flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-2xl border border-border bg-bg p-3">
                    <p class="text-xs uppercase tracking-[0.18em] text-muted">Tentativas</p>
                    <p class="mt-2 text-2xl font-semibold text-foreground">
                      {{ currentSession.attempts_used }}/{{ currentSession.max_attempts }}
                    </p>
                  </div>
                  <div class="rounded-2xl border border-border bg-bg p-3">
                    <p class="text-xs uppercase tracking-[0.18em] text-muted">Restantes</p>
                    <p class="mt-2 text-2xl font-semibold text-foreground">
                      {{ currentSession.attempts_remaining }}
                    </p>
                  </div>
                  <div class="rounded-2xl border border-border bg-bg p-3">
                    <p class="text-xs uppercase tracking-[0.18em] text-muted">Pista do título</p>
                    <p class="mt-2 text-2xl font-semibold text-foreground">
                      {{ currentSession.title_hint.word_count }}
                      {{ currentSession.title_hint.word_count === 1 ? 'palavra' : 'palavras' }}
                    </p>
                  </div>
                  <div class="rounded-2xl border border-border bg-bg p-3">
                    <p class="text-xs uppercase tracking-[0.18em] text-muted">Score</p>
                    <p class="mt-2 text-2xl font-semibold text-foreground">
                      {{ currentSession.score ?? initialScore }}
                    </p>
                  </div>
                </div>

                @if (currentSession.reveal) {
                  <div class="rounded-2xl border border-border bg-bg p-4">
                    <p class="text-xs uppercase tracking-[0.18em] text-muted">Revelação</p>
                    <h2 class="mt-2 text-xl font-semibold text-foreground">{{ currentSession.reveal.title }}</h2>
                    <p class="mt-1 text-sm text-muted">
                      {{ currentSession.reveal.original_title }} · {{ currentSession.reveal.release_year ?? '-' }}
                    </p>
                  </div>
                }

                @if (currentSession.status !== 'playing') {
                  <app-next-challenge-countdown (next)="onNextChallenge()" />
                }

                @if (currentSession.status === 'playing' && bestClues(); as clues) {
                  <div class="rounded-2xl border border-border bg-bg p-4">
                    <ng-container [ngTemplateOutlet]="infoCard" [ngTemplateOutletContext]="{ $implicit: clues }" />
                  </div>
                }
              </div>

              @if (currentSession.status !== 'playing' && bestClues(); as clues) {
                <div class="rounded-2xl border border-border bg-bg p-4 lg:col-span-2">
                  <ng-container [ngTemplateOutlet]="infoCard" [ngTemplateOutletContext]="{ $implicit: clues }" />
                </div>
              }
            </div>
          }

          <ng-template #infoCard let-clues>
            <p class="text-xs uppercase tracking-[0.18em] text-muted">Informações</p>
            <p class="mt-1 text-sm font-medium" [class]="infoHeading().className">
              {{ infoHeading().text }}
            </p>
            <div class="mt-3">
              <app-guess-clues [clues]="clues" />
            </div>
          </ng-template>

          @if (error()) {
            <p class="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {{ error() }}
            </p>
          }
        </article>

        <aside class="rounded-3xl border border-border bg-surface p-6">
          <h2 class="text-xl font-semibold text-foreground">Enviar palpite</h2>
          <p class="mt-2 text-sm text-muted">
            Digite ao menos 3 letras do título para buscar o filme.
          </p>

          <div class="mt-5 space-y-3">
            <app-movie-autocomplete (movieSelected)="onMovieSelected($event)" />

            <app-button
              [fullWidth]="true"
              [disabled]="submitting() || !selectedMovie()"
              (click)="sendGuess()"
            >
              {{ submitting() ? 'Enviando...' : 'Enviar palpite' }}
            </app-button>
          </div>

          <div class="mt-8">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Palpites anteriores</h3>
              @if (session(); as currentSession) {
                @if (currentSession.previous_guesses.length > 0) {
                  <span class="text-xs text-muted">Clique para ver as pistas</span>
                }
              }
            </div>

            <div class="mt-4 space-y-3">
              @if (session(); as currentSession) {
                @for (guess of recentFirst(currentSession); track guess.attempt_number) {
                  <app-previous-guess-card [guess]="guess" />
                } @empty {
                  <p class="text-sm text-muted">Nenhum palpite ainda.</p>
                }
              }
            </div>
          </div>
        </aside>
      </div>
    </section>
  `,
})
export class DailyPage implements OnInit {
  private readonly dailyGameService = inject(DailyGameService);

  protected readonly session = this.dailyGameService.session;
  protected readonly loading = this.dailyGameService.loading;
  protected readonly submitting = this.dailyGameService.submitting;
  protected readonly error = this.dailyGameService.error;
  protected readonly lastGuess = this.dailyGameService.lastGuess;
  protected readonly selectedMovie = signal<MovieSearchResult | null>(null);

  /** Sem sessão ainda (nenhum palpite enviado), o backend manda `score:
   * null`; o jogador começa com 1000 pontos (`INITIAL_SCORE` no backend,
   * `apps/games/constants.py`), então mostra isso em vez de "-". */
  protected readonly initialScore = 1000;

  protected readonly statusLabel = computed(() => {
    const status = (this.session()?.status ?? 'playing') as SessionStatus;
    return this.loading() ? 'Carregando' : STATUS_LABEL[status];
  });

  protected readonly statusClass = computed(() => {
    const status = (this.session()?.status ?? 'playing') as SessionStatus;
    return STATUS_STYLES[status];
  });

  /** Melhor resultado de cada pista, considerando todos os palpites já
   * enviados nesta sessão (não só o último): ver `mergeBestClues`. Quando o
   * jogo termina (ganhou ou esgotou as tentativas), mostra as informações
   * certas de verdade a partir da revelação, não a mistura dos palpites. */
  protected readonly bestClues = computed<GuessClues | null>(() => {
    const session = this.session();
    if (!session) {
      return null;
    }
    if (session.status !== 'playing' && session.reveal) {
      return allCorrectClues(session.reveal);
    }
    const guesses = session.previous_guesses.map((guess) => guess.clues).filter(hasClues);
    return mergeBestClues(guesses);
  });

  /** Texto/cor do resumo do card de informações. Depende do status da
   * sessão (persiste entre recarregamentos de página), não só do último
   * palpite enviado nesta aba: por isso o card continua aparecendo mesmo
   * quando as tentativas já acabaram e a página é recarregada depois. */
  protected readonly infoHeading = computed(() => {
    const session = this.session();
    if (session?.status === 'won') {
      return { text: 'Você acertou! 🎉', className: 'text-success' };
    }
    if (session?.status === 'lost') {
      return { text: 'Suas tentativas acabaram, essas são as informações certas', className: 'text-error' };
    }
    const last = this.lastGuess();
    if (last) {
      return last.correct
        ? { text: 'Você acertou! 🎉', className: 'text-success' }
        : { text: 'Errou, tente de novo', className: 'text-muted' };
    }
    return { text: 'Suas pistas até agora', className: 'text-muted' };
  });

  ngOnInit(): void {
    this.dailyGameService.loadSession();
  }

  protected onNextChallenge(): void {
    this.dailyGameService.loadSession();
  }

  protected onMovieSelected(movie: MovieSearchResult): void {
    this.selectedMovie.set(movie);
  }

  protected sendGuess(): void {
    const movie = this.selectedMovie();
    if (!movie) {
      return;
    }

    this.dailyGameService.submitGuess(movie.tmdb_id);
    this.selectedMovie.set(null);
  }

  /** Enquanto jogando, o pôster mantém a proporção original (2:3 ou 16:9),
   * `self-start`: a coluna ao lado só tem o grid de estatísticas, bem mais
   * curta. Quando o jogo termina, essa coluna ganha "Revelação" e
   * "Próximo desafio em" (o card de Informações já saiu daqui, virou
   * largura cheia embaixo), então o pôster estica (`self-stretch h-full`,
   * sem proporção fixa) até acompanhar essa altura, terminando alinhado
   * com o rodapé do card "Próximo desafio em". */
  protected posterWrapperClass(session: DailyChallengeState): string {
    if (session.status !== 'playing') {
      return 'self-stretch h-full';
    }
    return session.image_source === 'backdrop' ? 'self-start aspect-video' : 'self-start aspect-[2/3]';
  }

  protected recentFirst(session: DailyChallengeState): readonly DailyPreviousGuess[] {
    return session.previous_guesses.slice().reverse();
  }

  protected readonly posterUrl = this.dailyGameService.posterObjectUrl;
}