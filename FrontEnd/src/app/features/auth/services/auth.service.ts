import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AnonSessionService } from '../../../core/services/anon-session.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { resolveApiErrorMessage } from '../../../shared/utils/http-error-message.util';
import type { ApiEnvelope } from '../../daily/models/daily-session.model';
import type {
  AuthPayload,
  ChangePasswordRequest,
  MePayload,
  RegisterRequest,
  UserProfile,
  UserStats,
} from '../models/auth.model';
import { AuthModalService } from './auth-modal.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(TokenStorageService);
  private readonly anonSession = inject(AnonSessionService);
  private readonly authModal = inject(AuthModalService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly userState = signal<UserProfile | null>(null);
  private readonly statsState = signal<UserStats | null>(null);
  private readonly submittingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly noticeState = signal<string | null>(null);

  readonly user = this.userState.asReadonly();
  readonly stats = this.statsState.asReadonly();
  readonly submitting = this.submittingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly notice = this.noticeState.asReadonly();

  constructor() {
    // Sessão persistida de uma visita anterior: restaura o perfil.
    if (isPlatformBrowser(this.platformId) && this.storage.access()) {
      this.loadMe();
    }
  }

  isLoggedIn(): boolean {
    return this.storage.access() !== null;
  }

  /** Validador ajax do campo de usuário no cadastro: o backend não diz
   * *por que* está indisponível (formato ou já em uso), só se está. */
  checkUsernameAvailable(username: string): Observable<boolean> {
    return this.http
      .get<ApiEnvelope<{ available: boolean }>>(this.buildUrl('auth/username-available/'), {
        params: { username },
      })
      .pipe(
        map((response) => response.data.available),
        catchError(() => of(true)),
      );
  }

  login(identifier: string, password: string): void {
    this.beginRequest();
    this.http
      .post<ApiEnvelope<AuthPayload>>(
        this.buildUrl('auth/login/'),
        { identifier, password },
        // O token anônimo vai junto pro backend adotar o progresso da conta.
        { headers: this.anonSession.headers() },
      )
      .pipe(finalize(() => this.submittingState.set(false)))
      .subscribe({
        next: (response) => this.onAuthenticated(response.data),
        error: (error: HttpErrorResponse) => this.errorState.set(this.messageOf(error)),
      });
  }

  register(request: RegisterRequest): void {
    this.beginRequest();
    this.http
      .post<ApiEnvelope<AuthPayload>>(this.buildUrl('auth/register/'), request, {
        headers: this.anonSession.headers(),
      })
      .pipe(finalize(() => this.submittingState.set(false)))
      .subscribe({
        next: (response) => this.onAuthenticated(response.data),
        error: (error: HttpErrorResponse) => this.errorState.set(this.messageOf(error)),
      });
  }

  logout(): void {
    const refresh = this.storage.refresh();
    if (refresh) {
      // Blacklist no servidor; o estado local é limpo de qualquer forma.
      this.http
        .post<ApiEnvelope<null>>(this.buildUrl('auth/logout/'), { refresh })
        .subscribe({ error: () => undefined });
    }
    this.storage.clear();
    this.userState.set(null);
    this.statsState.set(null);
    this.router.navigateByUrl('/');
  }

  changePassword(request: ChangePasswordRequest): void {
    this.beginRequest();
    this.http
      .post<ApiEnvelope<null>>(this.buildUrl('auth/change-password/'), request)
      .pipe(finalize(() => this.submittingState.set(false)))
      .subscribe({
        next: (response) => this.noticeState.set(response.message || 'Senha alterada.'),
        error: (error: HttpErrorResponse) => this.errorState.set(this.messageOf(error)),
      });
  }

  loadMe(): void {
    this.fetchMe().subscribe();
  }

  /** Versão observable de `loadMe()`, usada pelo `adminGuard`, que precisa
   * esperar a resposta antes de decidir se deixa entrar (o cache do signal
   * `user()` pode ainda não existir num hard refresh). */
  fetchMe(): Observable<MePayload | null> {
    return this.http.get<ApiEnvelope<MePayload>>(this.buildUrl('users/me/')).pipe(
      tap((response) => {
        this.userState.set(response.data.user);
        this.statsState.set(response.data.stats);
      }),
      map((response) => response.data),
      catchError(() => {
        // Access e refresh expirados (interceptor já limpou o storage).
        this.userState.set(null);
        this.statsState.set(null);
        return of(null);
      }),
    );
  }

  clearMessages(): void {
    this.errorState.set(null);
    this.noticeState.set(null);
  }

  private onAuthenticated(payload: AuthPayload): void {
    this.storage.store(payload.tokens);
    this.userState.set(payload.user);
    // O progresso anônimo foi adotado pela conta, então o token não vale mais.
    this.anonSession.storeToken(null);
    this.loadMe();
    // É um modal: fecha e deixa o jogador onde estava, em vez de navegar.
    this.authModal.close();
  }

  private beginRequest(): void {
    this.submittingState.set(true);
    this.errorState.set(null);
    this.noticeState.set(null);
  }

  private buildUrl(path: string): string {
    return `${environment.apiBaseUrl}/api/v1/${path}`;
  }

  private messageOf(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return resolveApiErrorMessage(error, 'Não foi possível falar com o servidor.');
    }
    const body = error.error;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (Array.isArray(first) && typeof first[0] === 'string') {
        return first[0];
      }
    }
    return resolveApiErrorMessage(error, 'Não foi possível falar com o servidor.');
  }
}
