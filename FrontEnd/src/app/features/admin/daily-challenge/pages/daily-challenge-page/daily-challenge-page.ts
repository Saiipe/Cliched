import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { IconArrowLeft, IconCalendarStar, IconCheck, IconDice5, IconPlayerTrackNextFilled } from '@tabler/icons-angular';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';

import { Icon } from '../../../../../shared/ui/icon/icon';
import type { MovieSearchResult } from '../../../../daily/models/daily-session.model';
import type {
  AdminDailyChallenge,
  GalleryImage,
  PosterLanguage,
} from '../../models/admin-daily-challenge.model';
import { AdminDailyChallengeService } from '../../services/admin-daily-challenge.service';

const TMDB_POSTER_THUMB = 'https://image.tmdb.org/t/p/w154';
const TMDB_THUMB = 'https://image.tmdb.org/t/p/w92';
const MIN_QUERY_LENGTH = 3;

type LanguageFilter = 'all' | 'pt' | 'en' | 'textless';

const LANGUAGE_FILTERS: readonly { readonly value: LanguageFilter; readonly label: string }[] = [
  { value: 'all', label: 'Todos os idiomas' },
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'textless', label: 'Sem texto' },
];

@Component({
  selector: 'app-admin-daily-challenge-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  template: `
    <div class="border-b border-border">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-2 px-6 py-3">
        <span class="flex items-center gap-2 text-sm text-muted">
          <app-icon [icon]="calendarIcon" [size]="16" />
          Painel administrativo · Desafio diário
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
      <h1 class="text-3xl font-bold text-foreground">Desafio de amanhã</h1>
      <p class="mt-1 text-muted">
        Escolha o filme e qual pôster da galeria do TMDB vira a imagem pixelizada do jogo.
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
                  {{ current.movie.director || 'Direção desconhecida' }} ·
                  {{ genreNames(current.movie.genres) }}
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

            <div
              class="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-warning/40 bg-warning/5 px-4 py-3"
            >
              <div>
                <p class="text-sm font-medium text-warning">Ferramenta de teste</p>
                <p class="text-xs text-muted">
                  Pula a espera até meia-noite: o desafio de amanhã vira o de hoje agora.
                </p>
              </div>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2 text-sm font-medium text-warning transition hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-50"
                [disabled]="saving()"
                (click)="advanceChallenge()"
              >
                <app-icon [icon]="fastForwardIcon" [size]="16" />
                Adiantar para hoje
              </button>
            </div>

            <div class="mt-8 flex flex-wrap items-center gap-4">
              <img
                [src]="posterThumb(selectedPosterPath(current))"
                alt="Pôster selecionado"
                class="aspect-[2/3] w-16 shrink-0 rounded-lg border-2 border-success object-cover"
              />
              <div>
                <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                  Pôster do jogo
                </h3>
                <p class="mt-1 text-sm text-muted">
                  Este é o pôster selecionado agora. Escolha outro na galeria abaixo.
                </p>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
              <h4 class="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Galeria: trocar pôster
              </h4>

              <select
                (change)="onLanguageFilterChange($event)"
                [disabled]="saving() || !current.swappable"
                class="rounded-xl border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none focus:border-secondary disabled:opacity-50"
              >
                @for (option of languageFilters; track option.value) {
                  <option [value]="option.value" [selected]="option.value === languageFilter()">
                    {{ option.label }}
                  </option>
                }
              </select>
            </div>

            <div class="mt-4 flex flex-wrap gap-3">
              @for (img of filteredPosters(); track img.file_path) {
                <button
                  type="button"
                  class="relative w-24 shrink-0 overflow-hidden rounded-xl border-2 transition"
                  [class]="
                    isPosterSelected(img.file_path) ? 'border-success' : 'border-border hover:border-muted'
                  "
                  [disabled]="saving() || !current.swappable"
                  (click)="choosePoster(img.file_path)"
                >
                  <img [src]="posterThumb(img.file_path)" alt="" class="aspect-[2/3] w-full object-cover" />
                  @if (isPosterSelected(img.file_path)) {
                    <span
                      class="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-success text-bg"
                    >
                      <app-icon [icon]="checkIcon" [size]="12" />
                    </span>
                  }
                </button>
              } @empty {
                <p class="text-sm text-muted">
                  {{
                    gallery()
                      ? 'Nenhum pôster encontrado para este filtro.'
                      : 'Carregando galeria...'
                  }}
                </p>
              }
            </div>

            @if (!current.swappable) {
              <p class="mt-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                O dia deste desafio já começou, então filme e imagem não podem mais ser alterados.
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
                  class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary disabled:opacity-50"
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
            </div>

            <div class="rounded-2xl border border-border bg-surface p-6">
              <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Ficha</h3>
              <dl class="mt-4 space-y-2 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="text-muted">Título original</dt>
                  <dd class="text-right text-foreground">{{ current.movie.original_title || '-' }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-muted">País</dt>
                  <dd class="text-foreground">{{ current.movie.origin_country || '-' }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-muted">Duração</dt>
                  <dd class="text-foreground">
                    {{ current.movie.runtime ? current.movie.runtime + ' min' : '-' }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="shrink-0 text-muted">Elenco</dt>
                  <dd class="text-right text-foreground">{{ current.movie.top_cast.join(', ') || '-' }}</dd>
                </div>
              </dl>
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
export class AdminDailyChallengePage implements OnInit {
  private readonly adminService = inject(AdminDailyChallengeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly querySubject = new Subject<string>();

  protected readonly calendarIcon = IconCalendarStar;
  protected readonly backIcon = IconArrowLeft;
  protected readonly checkIcon = IconCheck;
  protected readonly diceIcon = IconDice5;
  protected readonly fastForwardIcon = IconPlayerTrackNextFilled;

  protected readonly challenge = this.adminService.challenge;
  protected readonly currentChallenge = this.adminService.currentChallenge;
  protected readonly gallery = this.adminService.gallery;
  protected readonly loading = this.adminService.loading;
  protected readonly saving = this.adminService.saving;
  protected readonly error = this.adminService.error;
  protected readonly notice = this.adminService.notice;

  protected readonly query = signal('');
  protected readonly results = signal<readonly MovieSearchResult[]>([]);
  protected readonly searching = signal(false);
  protected readonly open = signal(false);
  protected readonly languageFilter = signal<LanguageFilter>('textless');
  protected readonly languageFilters = LANGUAGE_FILTERS;

  protected readonly resultsOpen = computed(
    () => this.open() && this.query().trim().length >= MIN_QUERY_LENGTH,
  );

  protected readonly filteredPosters = computed<readonly GalleryImage[]>(() => {
    const posters = this.gallery()?.posters ?? [];
    const filter = this.languageFilter();
    if (filter === 'all') {
      return posters;
    }
    const wanted: PosterLanguage = filter === 'textless' ? null : filter;
    return posters.filter((poster) => poster.iso_639_1 === wanted);
  });

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

  protected choosePoster(path: string): void {
    if (!this.isPosterSelected(path)) {
      this.adminService.choosePoster(path);
    }
  }

  protected isPosterSelected(path: string): boolean {
    return this.selectedPosterPath(this.challenge()) === path;
  }

  protected selectedPosterPath(current: AdminDailyChallenge | null): string {
    if (!current) {
      return '';
    }
    return current.image_path || current.movie.poster_path;
  }

  protected onLanguageFilterChange(event: Event): void {
    this.languageFilter.set((event.target as HTMLSelectElement).value as LanguageFilter);
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

  protected advanceChallenge(): void {
    this.adminService.advanceChallenge();
  }

  protected genreNames(genres: readonly { id: number; name: string }[]): string {
    return genres.map((genre) => genre.name).join(', ') || '-';
  }

  protected posterThumb(path: string): string {
    return `${TMDB_POSTER_THUMB}${path}`;
  }

  protected thumb(path: string): string {
    return `${TMDB_THUMB}${path}`;
  }
}
