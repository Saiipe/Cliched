import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { resolveApiErrorMessage } from '../../../../shared/utils/http-error-message.util';
import type { ApiEnvelope } from '../../../daily/models/daily-session.model';
import type { AdminUser, LoginEvent } from '../models/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);

  private readonly usersState = signal<readonly AdminUser[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  private readonly loginHistoryState = signal<readonly LoginEvent[]>([]);
  private readonly loginHistoryUserIdState = signal<number | null>(null);
  private readonly loginHistoryLoadingState = signal(false);

  readonly users = this.usersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly loginHistory = this.loginHistoryState.asReadonly();
  readonly loginHistoryUserId = this.loginHistoryUserIdState.asReadonly();
  readonly loginHistoryLoading = this.loginHistoryLoadingState.asReadonly();

  loadUsers(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.http
      .get<ApiEnvelope<{ users: readonly AdminUser[] }>>(this.buildUrl('users/admin/'))
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (response) => this.usersState.set(response.data.users),
        error: (error: HttpErrorResponse) => this.errorState.set(this.messageOf(error)),
      });
  }

  toggleLoginHistory(userId: number): void {
    if (this.loginHistoryUserIdState() === userId) {
      this.loginHistoryUserIdState.set(null);
      this.loginHistoryState.set([]);
      return;
    }

    this.loginHistoryUserIdState.set(userId);
    this.loginHistoryLoadingState.set(true);
    this.http
      .get<ApiEnvelope<{ logins: readonly LoginEvent[] }>>(
        this.buildUrl(`users/admin/${userId}/logins/`),
      )
      .pipe(finalize(() => this.loginHistoryLoadingState.set(false)))
      .subscribe({
        next: (response) => this.loginHistoryState.set(response.data.logins),
        error: () => this.loginHistoryState.set([]),
      });
  }

  private buildUrl(path: string): string {
    return `${environment.apiBaseUrl}/api/v1/${path}`;
  }

  private messageOf(error: HttpErrorResponse): string {
    return resolveApiErrorMessage(error, 'Não foi possível falar com o servidor.');
  }
}
