import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { resolveApiErrorMessage } from '../../../shared/utils/http-error-message.util';
import type { ApiEnvelope } from '../../daily/models/daily-session.model';
import type { CastChallengeState, CastGuessResult } from '../models/cast-session.model';

/** Chave própria, separada da do desafio diário: cada jogo tem sua sessão
 * anônima no backend, um token não vale pro outro. */
const CAST_ANON_TOKEN_KEY = 'cliched.cast.anon_token';

@Injectable({ providedIn: 'root' })
export class CastGameService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly sessionState = signal<CastChallengeState | null>(null);
  private readonly lastGuessState = signal<CastGuessResult | null>(null);
  private readonly loadingState = signal(false);
  private readonly submittingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly session = this.sessionState.asReadonly();
  readonly lastGuess = this.lastGuessState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly submitting = this.submittingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  loadSession(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.http
      .get<ApiEnvelope<CastChallengeState>>(this.buildUrl('games/cast/'), {
        headers: this.headers(),
      })
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (response) => {
          this.sessionState.set(response.data);
          this.lastGuessState.set(null);
        },
        error: (error: HttpErrorResponse) => {
          this.errorState.set(this.messageOf(error));
        },
      });
  }

  submitGuess(tmdbId: number): void {
    this.submittingState.set(true);
    this.errorState.set(null);

    this.http
      .post<ApiEnvelope<CastGuessResult>>(
        this.buildUrl('games/cast/guess/'),
        { tmdb_id: tmdbId },
        { headers: this.headers() },
      )
      .pipe(finalize(() => this.submittingState.set(false)))
      .subscribe({
        next: (response) => {
          this.sessionState.set(response.data);
          this.lastGuessState.set(response.data);
          // Só vem preenchido na resposta que cria a sessão (1º palpite).
          if (response.data.anon_token) {
            this.storeToken(response.data.anon_token);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorState.set(this.messageOf(error));
        },
      });
  }

  private headers(): HttpHeaders | undefined {
    const token = this.getToken();
    return token ? new HttpHeaders({ 'X-Anon-Token': token }) : undefined;
  }

  private getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return window.localStorage.getItem(CAST_ANON_TOKEN_KEY);
  }

  private storeToken(token: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.localStorage.setItem(CAST_ANON_TOKEN_KEY, token);
  }

  private buildUrl(path: string): string {
    return `${environment.apiBaseUrl}/api/v1/${path}`;
  }

  private messageOf(error: HttpErrorResponse): string {
    return resolveApiErrorMessage(error, 'Não foi possível carregar o jogo de elenco.');
  }
}
