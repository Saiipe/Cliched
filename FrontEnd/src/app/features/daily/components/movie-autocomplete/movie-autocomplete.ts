import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';

import { DailyGameService } from '../../services/daily-game.service';
import type { MovieSearchResult } from '../../models/daily-session.model';

const MIN_QUERY_LENGTH = 3;
const TMDB_THUMB_BASE_URL = 'https://image.tmdb.org/t/p/w92';

@Component({
  selector: 'app-movie-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <input
        type="text"
        [value]="query()"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        autocomplete="off"
        class="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-foreground outline-none transition focus:border-secondary"
        placeholder="Digite o nome do filme..."
      />

      @if (open()) {
        <div
          class="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-lg"
        >
          @if (searching()) {
            <p class="px-4 py-3 text-sm text-muted">Buscando...</p>
          } @else if (results().length > 0) {
            @for (movie of results(); track movie.tmdb_id) {
              <button
                type="button"
                class="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-bg"
                (mousedown)="selectMovie(movie)"
              >
                @if (posterThumb(movie.poster_path); as thumb) {
                  <img [src]="thumb" alt="" class="h-12 w-8 rounded object-cover" />
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
            }
          } @else if (query().trim().length >= MIN_QUERY_LENGTH) {
            <p class="px-4 py-3 text-sm text-muted">Nenhum filme encontrado.</p>
          }
        </div>
      }
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class MovieAutocomplete {
  private readonly dailyGameService = inject(DailyGameService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly querySubject = new Subject<string>();

  protected readonly MIN_QUERY_LENGTH = MIN_QUERY_LENGTH;

  readonly movieSelected = output<MovieSearchResult>();

  protected readonly query = signal('');
  protected readonly results = signal<readonly MovieSearchResult[]>([]);
  protected readonly searching = signal(false);
  protected readonly open = signal(false);

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
          return this.dailyGameService.searchMovies(value).pipe(
            catchError(() => of<readonly MovieSearchResult[]>([])),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.searching.set(false);
        this.results.set(results);
      });
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.open.set(true);
    this.querySubject.next(value);
  }

  protected onFocus(): void {
    if (this.results().length > 0) {
      this.open.set(true);
    }
  }

  protected onBlur(): void {
    this.open.set(false);
  }

  protected selectMovie(movie: MovieSearchResult): void {
    this.query.set(movie.title);
    this.results.set([]);
    this.open.set(false);
    this.movieSelected.emit(movie);
  }

  protected posterThumb(path: string | null): string | null {
    return path ? `${TMDB_THUMB_BASE_URL}${path}` : null;
  }
}
