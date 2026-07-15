import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AnonSessionService } from '../../../core/services/anon-session.service';
import type {
  ApiEnvelope,
  DailyChallengeState,
  DailyGuessRequest,
  DailyGuessResult,
  MovieSearchResult,
  TMDBSearchResponse,
} from '../models/daily-session.model';

@Injectable({ providedIn: 'root' })
export class DailyGameService {
  private readonly http = inject(HttpClient);
  private readonly anonSession = inject(AnonSessionService);

  private readonly sessionState = signal<DailyChallengeState | null>(null);
  private readonly guessState = signal<DailyGuessResult | null>(null);
  private readonly loadingState = signal(false);
  private readonly submittingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly session = this.sessionState.asReadonly();
  readonly lastGuess = this.guessState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly submitting = this.submittingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  loadSession(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.http
      .get<ApiEnvelope<DailyChallengeState>>(this.buildUrl('games/daily/'), {
        headers: this.anonSession.headers(),
      })
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (response) => {
          this.sessionState.set(response.data);
          // Evita mostrar o "último palpite" de uma partida encerrada quando
          // um novo desafio é carregado (ex.: após o contador para o próximo).
          this.guessState.set(null);
        },
        error: (error: HttpErrorResponse) => {
          this.errorState.set(this.resolveErrorMessage(error));
        },
      });
  }

  submitGuess(tmdbId: number): void {
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
      this.errorState.set('Informe um TMDB ID válido.');
      return;
    }

    this.submittingState.set(true);
    this.errorState.set(null);

    const body: DailyGuessRequest = { tmdb_id: tmdbId };

    this.http
      .post<ApiEnvelope<DailyGuessResult>>(this.buildUrl('games/daily/guess/'), body, {
        headers: this.anonSession.headers(),
      })
      .pipe(finalize(() => this.submittingState.set(false)))
      .subscribe({
        next: (response) => {
          this.sessionState.set(response.data);
          this.guessState.set(response.data);
          // anon_token só vem preenchido na resposta que CRIA a sessão (1º palpite);
          // nas seguintes o campo é omitido — não pode ser tratado como "limpar token".
          if (response.data.anon_token) {
            this.anonSession.storeToken(response.data.anon_token);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorState.set(this.resolveErrorMessage(error));
        },
      });
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

  posterUrl(path: string | null | undefined): string | null {
    if (!path) {
      return null;
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const token = this.anonSession.getToken();
    if (!token) {
      return `${environment.apiBaseUrl}${path}`;
    }

    const separator = path.includes('?') ? '&' : '?';
    return `${environment.apiBaseUrl}${path}${separator}token=${encodeURIComponent(token)}`;
  }

  private buildUrl(path: string): string {
    return `${environment.apiBaseUrl}/api/v1/${path}`;
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    return error.error?.message ?? 'Não foi possível carregar a sessão diária.';
  }
}