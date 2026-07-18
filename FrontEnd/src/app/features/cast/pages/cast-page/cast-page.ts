import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { IconChairDirector, IconUserQuestion } from '@tabler/icons-angular';

import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';
import type { RevealDetail } from '../../../../shared/ui/reveal-modal/reveal-modal';
import { RevealModal } from '../../../../shared/ui/reveal-modal/reveal-modal';
import { MovieAutocomplete } from '../../../daily/components/movie-autocomplete/movie-autocomplete';
import { NextChallengeCountdown } from '../../../daily/components/next-challenge-countdown/next-challenge-countdown';
import type { MovieSearchResult } from '../../../daily/models/daily-session.model';
import { CastGameService } from '../../services/cast-game.service';

const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

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
  selector: 'app-cast-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, MovieAutocomplete, NextChallengeCountdown, RevealModal],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div class="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <article class="rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.45)]">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.3em] text-muted">Elenco</p>
              <h1 class="mt-2 text-3xl font-bold text-foreground">Adivinhe pelo elenco</h1>
              <p class="mt-3 max-w-2xl text-sm text-muted">
                Comece pelo rosto do ator principal. A cada erro, mais um nome do elenco é
                revelado e, na reta final, o diretor entra na dica.
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
            <p class="mt-8 text-sm text-muted">Carregando desafio...</p>
          } @else if (session(); as currentSession) {
            @if (currentSession.status !== 'playing') {
              <div class="mt-8">
                <app-next-challenge-countdown (next)="onNextChallenge()" />
              </div>
            }

            <div class="mt-6 grid grid-cols-3 gap-3">
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
                <p class="text-xs uppercase tracking-[0.18em] text-muted">Score</p>
                <p class="mt-2 text-2xl font-semibold text-foreground">
                  {{ currentSession.score ?? initialScore }}
                </p>
              </div>
            </div>

            @if (currentSession.reveal; as reveal) {
              <div class="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-border bg-bg p-5 sm:flex-row sm:items-start">
                @if (reveal.poster_path) {
                  <img
                    [src]="posterUrl(reveal.poster_path)"
                    [alt]="'Pôster de ' + reveal.title"
                    class="w-36 shrink-0 rounded-xl border border-border object-cover"
                  />
                }
                <div class="text-center sm:text-left">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted">Revelação</p>
                  <p
                    class="mt-1 text-sm font-medium"
                    [class]="currentSession.status === 'won' ? 'text-success' : 'text-error'"
                  >
                    {{
                      currentSession.status === 'won'
                        ? 'Você acertou! 🎉'
                        : 'Suas tentativas acabaram, o filme era:'
                    }}
                  </p>
                  <h2 class="mt-2 text-2xl font-semibold text-foreground">{{ reveal.title }}</h2>
                  <p class="mt-1 text-sm text-muted">
                    {{ reveal.original_title }} · {{ reveal.release_year ?? '-' }}
                  </p>
                  <p class="mt-2 text-sm text-muted">Direção: {{ reveal.director }}</p>
                </div>
              </div>
            }

            <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              @for (member of currentSession.cast; track member.name) {
                <figure class="overflow-hidden rounded-2xl border border-border bg-bg">
                  <img
                    [src]="profileUrl(member.profile_path)"
                    [alt]="'Foto de ' + member.name"
                    class="aspect-[2/3] w-full object-cover"
                  />
                  <figcaption class="px-3 py-2 text-center text-sm font-medium text-foreground">
                    {{ member.name }}
                  </figcaption>
                </figure>
              }

              @for (slot of hiddenSlots(); track $index) {
                <div
                  class="flex aspect-[2/3.35] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-bg text-muted"
                >
                  <app-icon [icon]="unknownIcon" [size]="32" />
                  <span class="text-xs uppercase tracking-[0.18em]">Erre p/ revelar</span>
                </div>
              }

              <div
                class="flex aspect-[2/3.35] flex-col items-center justify-center gap-2 rounded-2xl border bg-bg px-3 text-center"
                [class]="
                  currentSession.director
                    ? 'border-secondary/40 text-foreground'
                    : 'border-dashed border-border text-muted'
                "
              >
                <app-icon [icon]="directorIcon" [size]="32" />
                <span class="text-xs uppercase tracking-[0.18em]">Direção</span>
                <span class="text-sm font-medium">
                  {{ currentSession.director ?? '?' }}
                </span>
              </div>
            </div>
          }

          @if (error()) {
            <p class="mt-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
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
              [disabled]="submitting() || !selectedMovie() || finished()"
              (click)="sendGuess()"
            >
              {{ submitting() ? 'Enviando...' : 'Enviar palpite' }}
            </app-button>
          </div>

          <div class="mt-8">
            <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
              Palpites anteriores
            </h3>

            <div class="mt-4 space-y-3">
              @if (session(); as currentSession) {
                @for (guess of recentFirst(); track $index) {
                  <div class="flex items-center justify-between gap-3 rounded-2xl border border-border bg-bg px-4 py-3">
                    <p class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{{ guess.title }}</p>
                    <span
                      class="shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium"
                      [class]="guess.is_correct ? 'bg-success/10 text-success' : 'bg-error/10 text-error'"
                    >
                      {{ guess.is_correct ? 'Acerto' : 'Erro' }}
                    </span>
                  </div>
                } @empty {
                  <p class="text-sm text-muted">Nenhum palpite ainda.</p>
                }
              }
            </div>
          </div>
        </aside>
      </div>

      @if (session(); as currentSession) {
        @if (currentSession.reveal; as reveal) {
          <app-reveal-modal
            [open]="modalOpen()"
            [won]="currentSession.status === 'won'"
            [title]="reveal.title"
            [subtitle]="reveal.original_title + ' · ' + (reveal.release_year ?? '-')"
            [posterUrl]="reveal.poster_path ? posterUrl(reveal.poster_path) : ''"
            [details]="revealDetails()"
            (closed)="modalOpen.set(false)"
          />
        }
      }
    </section>
  `,
})
export class CastPage implements OnInit {
  private readonly castGameService = inject(CastGameService);

  protected readonly session = this.castGameService.session;
  protected readonly loading = this.castGameService.loading;
  protected readonly submitting = this.castGameService.submitting;
  protected readonly error = this.castGameService.error;
  protected readonly selectedMovie = signal<MovieSearchResult | null>(null);
  protected readonly modalOpen = signal(false);

  protected readonly unknownIcon = IconUserQuestion;
  protected readonly directorIcon = IconChairDirector;
  protected readonly initialScore = 1000;

  protected readonly revealDetails = computed<readonly RevealDetail[]>(() => {
    const reveal = this.session()?.reveal;
    if (!reveal) {
      return [];
    }
    return [
      { label: 'Ano', value: reveal.release_year?.toString() ?? '-' },
      { label: 'Diretor', value: reveal.director ?? '-' },
    ];
  });

  /** `null` até o primeiro `session()` chegar: usado só pra saber se o
   * status *acabou de virar* won/lost (abre o modal sozinho) ou se a
   * sessão já chegou terminada assim (reload de página com o jogo já
   * concluído antes): nesse caso não deve reabrir o modal sozinho, só a
   * pedido do jogador via "Ver detalhes". */
  private previousStatus: SessionStatus | null = null;

  private readonly openOnReveal = effect(() => {
    const status = this.session()?.status ?? null;
    if (status && this.previousStatus === 'playing' && status !== 'playing') {
      this.modalOpen.set(true);
    }
    this.previousStatus = status;
  });

  protected readonly statusLabel = computed(() => {
    const status = (this.session()?.status ?? 'playing') as SessionStatus;
    return this.loading() ? 'Carregando' : STATUS_LABEL[status];
  });

  protected readonly statusClass = computed(() => {
    const status = (this.session()?.status ?? 'playing') as SessionStatus;
    return STATUS_STYLES[status];
  });

  /** Slots do elenco ainda não revelados (viram cards de "?"). */
  protected readonly hiddenSlots = computed<readonly unknown[]>(() => {
    const session = this.session();
    if (!session) {
      return [];
    }
    return Array.from({ length: session.total_cast - session.cast.length });
  });

  protected readonly finished = computed(() => this.session()?.status !== 'playing');

  ngOnInit(): void {
    this.castGameService.loadSession();
  }

  protected onNextChallenge(): void {
    this.modalOpen.set(false);
    this.castGameService.loadSession();
  }

  protected onMovieSelected(movie: MovieSearchResult): void {
    this.selectedMovie.set(movie);
  }

  protected sendGuess(): void {
    const movie = this.selectedMovie();
    if (!movie) {
      return;
    }
    this.castGameService.submitGuess(movie.tmdb_id);
    this.selectedMovie.set(null);
  }

  protected recentFirst() {
    return (this.session()?.previous_guesses ?? []).slice().reverse();
  }

  protected profileUrl(path: string): string {
    return `${TMDB_PROFILE_BASE}${path}`;
  }

  protected posterUrl(path: string): string {
    return `${TMDB_POSTER_BASE}${path}`;
  }
}
