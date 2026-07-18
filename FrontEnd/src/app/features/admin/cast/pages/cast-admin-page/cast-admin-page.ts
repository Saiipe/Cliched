import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { IconArrowLeft, IconCalendarStar, IconDice5 } from '@tabler/icons-angular';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';

import { Icon } from '../../../../../shared/ui/icon/icon';
import type { MovieSearchResult } from '../../../../daily/models/daily-session.model';
import { AdminCastChallengeService } from '../../services/admin-cast-challenge.service';

const TMDB_POSTER_THUMB = 'https://image.tmdb.org/t/p/w154';
const TMDB_PROFILE_THUMB = 'https://image.tmdb.org/t/p/w92';
const MIN_QUERY_LENGTH = 3;

@Component({
  selector: 'app-admin-cast-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  template: `
    <div class="border-b border-border">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-2 px-6 py-3">
        <span class="flex items-center gap-2 text-sm text-muted">
          <app-icon [icon]="calendarIcon" [size]="16" />
          Painel administrativo · Elenco
        </span>
        <a
          routerLink="/admin/jogos"
          class="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <app-icon [icon]="backIcon" [size]="16" />
          Voltar
        </a>
      </div>
    </div>

    <section class="mx-auto max-w-6xl px-6 py-10">
      <h1 class="text-3xl font-bold text-foreground">Elenco: desafio de amanhã</h1>
      <p class="mt-1 text-muted">
        Escolha o filme que os jogadores vão adivinhar pelo rosto do elenco.
      </p>

      @if (loading()) {
        <p class="mt-8 text-sm text-muted">Carregando desafio...</p>
      } @else if (challenge(); as current) {
        <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <article class="rounded-2xl border border-border bg-surface p-6">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-xs uppercase tracking-[0.2em] text-muted">{{ current.date }}</p>
                <h2 class="mt-1 text-2xl font-semibold text-foreground">
                  {{ current.movie.title }}
                  @if (current.movie.release_year) {
                    <span class="font-normal text-muted">({{ current.movie.release_year }})</span>
                  }
                </h2>
                <p class="mt-1 text-sm text-muted">
                  {{ current.movie.director || 'Direção desconhecida' }}
                </p>
              </div>

              <span
                class="rounded-full border px-3 py-1 text-xs font-medium"
                [class]="
                  current.status === 'ready'
                    ? 'border-success/40 bg-success/10 text-success'
                    : 'border-warning/40 bg-warning/10 text-warning'
                "
              >
                {{ current.status === 'ready' ? 'Pronto' : 'Preparando' }}
              </span>
            </div>

            <div class="mt-6 flex flex-wrap items-center gap-4">
              <img
                [src]="posterThumb(current.movie.poster_path)"
                alt="Pôster do filme"
                class="aspect-[2/3] w-16 shrink-0 rounded-lg border-2 border-success object-cover"
              />
              <div>
                <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                  Ordem de revelação do elenco
                </h3>
                <p class="mt-1 text-sm text-muted">
                  O jogador vê primeiro o ator principal; os demais aparecem a cada erro.
                </p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-3">
              @for (member of current.movie.top_cast; track member.name; let i = $index) {
                <div class="w-20 shrink-0 text-center">
                  <img
                    [src]="profileThumb(member.profile_path)"
                    [alt]="member.name"
                    class="aspect-[2/3] w-full rounded-xl border-2 border-border object-cover"
                  />
                  <p class="mt-1 truncate text-xs text-muted">{{ i + 1 }}. {{ member.name }}</p>
                </div>
              }
            </div>

            @if (!current.swappable) {
              <p class="mt-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                O dia deste desafio já começou, então o filme não pode mais ser trocado.
              </p>
            }
          </article>

          <aside class="space-y-4">
            @if (currentChallenge(); as today) {
              <div class="rounded-2xl border border-border bg-surface p-6">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                    Filme de hoje
                  </h3>
                  <span
                    class="rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success"
                  >
                    Ao vivo
                  </span>
                </div>
                <div class="mt-4 flex items-center gap-3">
                  <img
                    [src]="posterThumb(today.movie.poster_path)"
                    alt=""
                    class="aspect-[2/3] w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-foreground">
                      {{ today.movie.title }}
                      @if (today.movie.release_year) {
                        <span class="text-muted">({{ today.movie.release_year }})</span>
                      }
                    </p>
                    <p class="mt-0.5 truncate text-xs text-muted">
                      {{ today.movie.director || 'Direção desconhecida' }}
                    </p>
                  </div>
                </div>
              </div>
            }

            <div class="rounded-2xl border border-border bg-surface p-6">
              <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                Trocar o filme
              </h3>

              <div class="relative mt-4">
                <input
                  type="text"
                  [value]="query()"
                  (input)="onQueryInput($event)"
                  (blur)="closeResults()"
                  [disabled]="saving() || !current.swappable"
                  autocomplete="off"
                  placeholder="Buscar filme (3+ letras)..."
                  class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-base text-foreground outline-none transition focus:border-secondary disabled:opacity-50 sm:text-sm"
                />

                @if (resultsOpen()) {
                  <div class="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-lg">
                    @if (searching()) {
                      <p class="px-4 py-3 text-sm text-muted">Buscando...</p>
                    } @else {
                      @for (movie of results(); track movie.tmdb_id) {
                        <button
                          type="button"
                          class="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-bg"
                          (mousedown)="pickMovie(movie)"
                        >
                          @if (movie.poster_path) {
                            <img [src]="thumb(movie.poster_path)" alt="" class="h-12 w-8 rounded object-cover" />
                          } @else {
                            <span class="h-12 w-8 rounded bg-bg"></span>
                          }
                          <span class="text-sm text-foreground">
                            {{ movie.title }}
                            @if (movie.release_year) {
                              <span class="text-muted">({{ movie.release_year }})</span>
                            }
                          </span>
                        </button>
                      } @empty {
                        <p class="px-4 py-3 text-sm text-muted">Nenhum filme encontrado.</p>
                      }
                    }
                  </div>
                }
              </div>

              <button
                type="button"
                class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
                [disabled]="saving() || !current.swappable"
                (click)="randomSwap()"
              >
                <app-icon [icon]="diceIcon" [size]="16" />
                Sortear outro filme
              </button>

              <p class="mt-3 text-xs text-muted">
                O sorteio evita filmes já usados no desafio diário ou em outro dia do elenco, e só
                aceita filmes com elenco (com foto) e diretor suficientes pro jogo.
              </p>
            </div>
          </aside>
        </div>
      }
    </section>

    <div class="pointer-events-none fixed right-4 top-24 z-50 flex w-full max-w-sm flex-col gap-3">
      @if (notice()) {
        <p
          class="pointer-events-auto rounded-xl border border-success/40 bg-surface-elevated px-4 py-3 text-sm text-success shadow-lg"
        >
          {{ notice() }}
        </p>
      }
      @if (error()) {
        <p
          class="pointer-events-auto rounded-xl border border-error/30 bg-surface-elevated px-4 py-3 text-sm text-error shadow-lg"
        >
          {{ error() }}
        </p>
      }
    </div>
  `,
})
export class CastAdminPage implements OnInit {
  private readonly adminService = inject(AdminCastChallengeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly querySubject = new Subject<string>();

  protected readonly calendarIcon = IconCalendarStar;
  protected readonly backIcon = IconArrowLeft;
  protected readonly diceIcon = IconDice5;

  protected readonly challenge = this.adminService.challenge;
  protected readonly currentChallenge = this.adminService.currentChallenge;
  protected readonly loading = this.adminService.loading;
  protected readonly saving = this.adminService.saving;
  protected readonly error = this.adminService.error;
  protected readonly notice = this.adminService.notice;

  protected readonly query = signal('');
  protected readonly results = signal<readonly MovieSearchResult[]>([]);
  protected readonly searching = signal(false);
  protected readonly open = signal(false);

  protected readonly resultsOpen = computed(
    () => this.open() && this.query().trim().length >= MIN_QUERY_LENGTH,
  );

  constructor() {
    this.querySubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          if (value.trim().length < MIN_QUERY_LENGTH) {
            this.searching.set(false);
            return of<readonly MovieSearchResult[]>([]);
          }
          this.searching.set(true);
          return this.adminService
            .searchMovies(value)
            .pipe(catchError(() => of<readonly MovieSearchResult[]>([])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.searching.set(false);
        this.results.set(results);
      });
  }

  ngOnInit(): void {
    this.adminService.loadNextChallenge();
  }

  protected onQueryInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.open.set(true);
    this.querySubject.next(value);
  }

  protected closeResults(): void {
    this.open.set(false);
  }

  protected pickMovie(movie: MovieSearchResult): void {
    this.query.set('');
    this.results.set([]);
    this.open.set(false);
    this.adminService.swapMovie(movie.tmdb_id);
  }

  protected randomSwap(): void {
    this.adminService.swapMovie(null);
  }

  protected posterThumb(path: string): string {
    return `${TMDB_POSTER_THUMB}${path}`;
  }

  protected profileThumb(path: string): string {
    return path ? `${TMDB_PROFILE_THUMB}${path}` : '';
  }

  protected thumb(path: string): string {
    return `${TMDB_POSTER_THUMB}${path}`;
  }
}
