import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Button } from '../../../../shared/ui/button/button';
import { GuessCluesGrid } from '../../components/guess-clues/guess-clues';
import { MovieAutocomplete } from '../../components/movie-autocomplete/movie-autocomplete';
import { NextChallengeCountdown } from '../../components/next-challenge-countdown/next-challenge-countdown';
import { PreviousGuessCard } from '../../components/previous-guess-card/previous-guess-card';
import type {
  DailyChallengeState,
  DailyPreviousGuess,
  GuessClues,
  MovieSearchResult,
} from '../../models/daily-session.model';
import { DailyGameService } from '../../services/daily-game.service';

function hasClues(clues: GuessClues | Record<string, never>): clues is GuessClues {
  return Object.keys(clues).length > 0;
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
  imports: [Button, MovieAutocomplete, GuessCluesGrid, PreviousGuessCard, NextChallengeCountdown],
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
                class="w-full self-start overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-lg"
                [class]="currentSession.image_source === 'backdrop' ? 'aspect-video' : 'aspect-[2/3]'"
              >
                @if (posterUrl(); as posterSrcValue) {
                  <img
                    class="h-full w-full object-cover"
                    [src]="posterSrcValue"
                    [alt]="'Pôster do desafio de ' + currentSession.date"
                  />
                }
              </div>

              <div class="space-y-4">
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
                    <p class="text-xs uppercase tracking-[0.18em] text-muted">Nível</p>
                    <p class="mt-2 text-2xl font-semibold text-foreground">
                      {{ currentSession.poster_level }}
                    </p>
                  </div>
                  <div class="rounded-2xl border border-border bg-bg p-3">
                    <p class="text-xs uppercase tracking-[0.18em] text-muted">Score</p>
                    <p class="mt-2 text-2xl font-semibold text-foreground">
                      {{ currentSession.score ?? '-' }}
                    </p>
                  </div>
                </div>

                <div class="rounded-2xl border border-border bg-bg p-4">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted">Pista do título</p>
                  <p class="mt-2 text-sm text-foreground">
                    {{ currentSession.title_hint.word_count }} palavra(s),
                    {{ currentSession.title_hint.length }} caracteres sem espaços.
                  </p>
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

                @if (lastGuess(); as guessResult) {
                  <div class="rounded-2xl border border-border bg-bg p-4">
                    <p class="text-xs uppercase tracking-[0.18em]" [class]="guessResult.correct ? 'text-success' : 'text-muted'">
                      Último palpite: {{ guessResult.correct ? 'acertou! 🎉' : 'errou' }}
                    </p>
                    @if (asClues(guessResult.clues); as clues) {
                      <div class="mt-3">
                        <app-guess-clues [clues]="clues" />
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

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

  protected readonly statusLabel = computed(() => {
    const status = (this.session()?.status ?? 'playing') as SessionStatus;
    return this.loading() ? 'Carregando' : STATUS_LABEL[status];
  });

  protected readonly statusClass = computed(() => {
    const status = (this.session()?.status ?? 'playing') as SessionStatus;
    return STATUS_STYLES[status];
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

  protected asClues(clues: GuessClues | Record<string, never>): GuessClues | null {
    return hasClues(clues) ? clues : null;
  }

  protected recentFirst(session: DailyChallengeState): readonly DailyPreviousGuess[] {
    return session.previous_guesses.slice().reverse();
  }

  protected readonly posterUrl = this.dailyGameService.posterObjectUrl;
}