import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { resolveApiErrorMessage } from '../../../../shared/utils/http-error-message.util';
import type { ApiEnvelope } from '../../../daily/models/daily-session.model';

interface RankingSettingsResponse {
  readonly mocks_enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class RankingSettingsService {
  private readonly http = inject(HttpClient);

  private readonly mocksEnabledState = signal(true);
  private readonly savingState = signal(false);
  private readonly noticeState = signal<string | null>(null);
  private readonly errorState = signal<string | null>(null);
  private toastTimeoutId: ReturnType<typeof setTimeout> | undefined;

  readonly mocksEnabled = this.mocksEnabledState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly notice = this.noticeState.asReadonly();
  readonly error = this.errorState.asReadonly();

  constructor() {
    this.load();
  }

  load(): void {
    this.http
      .get<ApiEnvelope<RankingSettingsResponse>>(this.buildUrl())
      .subscribe({
        next: (response) => this.mocksEnabledState.set(response.data.mocks_enabled),
        error: () => undefined,
      });
  }

  setMocksEnabled(enabled: boolean): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.noticeState.set(null);

    this.http
      .post<ApiEnvelope<RankingSettingsResponse>>(this.buildUrl(), { mocks_enabled: enabled })
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (response) => {
          this.mocksEnabledState.set(response.data.mocks_enabled);
          this.noticeState.set(
            response.data.mocks_enabled
              ? 'Jogadores mockados reativados no ranking.'
              : 'Jogadores mockados desativados no ranking.',
          );
          this.scheduleToastDismissal();
        },
        error: (error: HttpErrorResponse) => {
          this.errorState.set(
            resolveApiErrorMessage(error, 'Não foi possível atualizar a configuração.'),
          );
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
    }, 5000);
  }

  private buildUrl(): string {
    return `${environment.apiBaseUrl}/api/v1/rankings/settings/`;
  }
}
