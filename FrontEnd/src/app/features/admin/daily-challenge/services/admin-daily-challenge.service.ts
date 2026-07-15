import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, map, Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import type {
  ApiEnvelope,
  MovieSearchResult,
  TMDBSearchResponse,
} from '../../../daily/models/daily-session.model';
import type { AdminDailyChallenge, ImageGallery } from '../models/admin-daily-challenge.model';

const TOAST_DURATION_MS = 5000;

@Injectable({ providedIn: 'root' })
export class AdminDailyChallengeService {
  private readonly http = inject(HttpClient);
  private toastTimeoutId: ReturnType<typeof setTimeout> | undefined;

  private readonly challengeState = signal<AdminDailyChallenge | null>(null);
  private readonly currentChallengeState = signal<AdminDailyChallenge | null>(null);
  private readonly galleryState = signal<ImageGallery | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly noticeState = signal<string | null>(null);

  readonly challenge = this.challengeState.asReadonly();
  readonly currentChallenge = this.currentChallengeState.asReadonly();
  readonly gallery = this.galleryState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly notice = this.noticeState.asReadonly();

  loadCurrentChallenge(): void {
    this.http
      .get<ApiEnvelope<AdminDailyChallenge>>(this.buildUrl('games/daily/current/'))
      .subscribe({
        next: (response) => this.currentChallengeState.set(response.data),
        error: () => this.currentChallengeState.set(null),
      });
  }

  loadNextChallenge(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.http
      .get<ApiEnvelope<AdminDailyChallenge>>(this.buildUrl('games/daily/next/'))
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (response) => {
          this.challengeState.set(response.data);
          this.loadGallery();
        },
        error: (error: HttpErrorResponse) => this.errorState.set(this.messageOf(error)),
      });

    this.loadCurrentChallenge();
  }

  loadGallery(): void {
    this.http
      .get<ApiEnvelope<ImageGallery>>(this.buildUrl('games/daily/next/image/gallery/'))
      .subscribe({
        next: (response) => this.galleryState.set(response.data),
        error: () => this.galleryState.set(null),
      });
  }

  choosePoster(imagePath: string): void {
    this.mutate(
      this.http.post<ApiEnvelope<AdminDailyChallenge>>(this.buildUrl('games/daily/next/image/'), {
        image_source: 'poster',
        image_path: imagePath,
      }),
    );
  }

  advanceChallenge(): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.noticeState.set(null);

    this.http
      .post<ApiEnvelope<AdminDailyChallenge>>(this.buildUrl('games/daily/advance/'), {})
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (response) => {
          this.noticeState.set(response.message || 'Desafio adiantado.');
          this.scheduleToastDismissal();
          // O que era "amanhã" virou "hoje" — recarrega para mostrar o novo
          // "amanhã" (e sua galeria), não o desafio recém-adiantado.
          this.loadNextChallenge();
        },
        error: (error: HttpErrorResponse) => {
          this.errorState.set(this.messageOf(error));
          this.scheduleToastDismissal();
        },
      });
  }

  swapMovie(tmdbId: number | null): void {
    const body = tmdbId === null ? {} : { tmdb_id: tmdbId };
    this.mutate(
      this.http.post<ApiEnvelope<AdminDailyChallenge>>(
        this.buildUrl('games/daily/next/swap/'),
        body,
      ),
      { refreshGallery: true },
    );
  }

  searchMovies(query: string): Observable<readonly MovieSearchResult[]> {
    return this.http
      .get<ApiEnvelope<TMDBSearchResponse>>(this.buildUrl('movies/search/'), {
        params: { query },
      })
      .pipe(
        map((response) =>
          response.data.results.slice(0, 8).map((item) => ({
            tmdb_id: item.id,
            title: item.title,
            release_year: item.release_date ? Number(item.release_date.slice(0, 4)) : null,
            poster_path: item.poster_path,
          })),
        ),
      );
  }

  private mutate(
    request: Observable<ApiEnvelope<AdminDailyChallenge>>,
    options: { refreshGallery?: boolean } = {},
  ): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.noticeState.set(null);

    request.pipe(finalize(() => this.savingState.set(false))).subscribe({
      next: (response) => {
        this.challengeState.set(response.data);
        this.noticeState.set(response.message || 'Desafio atualizado.');
        this.scheduleToastDismissal();
        if (options.refreshGallery) {
          this.loadGallery();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.errorState.set(this.messageOf(error));
        this.scheduleToastDismissal();
      },
    });
  }

  private scheduleToastDismissal(): void {
    if (this.toastTimeoutId !== undefined) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastTimeoutId = setTimeout(() => {
      this.noticeState.set(null);
      this.errorState.set(null);
    }, TOAST_DURATION_MS);
  }

  private buildUrl(path: string): string {
    return `${environment.apiBaseUrl}/api/v1/${path}`;
  }

  private messageOf(error: HttpErrorResponse): string {
    return error.error?.message ?? 'Não foi possível falar com o servidor.';
  }
}
