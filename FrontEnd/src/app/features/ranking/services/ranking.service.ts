import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, map, of, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { resolveApiErrorMessage } from '../../../shared/utils/http-error-message.util';
import type { ApiEnvelope } from '../../daily/models/daily-session.model';
import type {
  RankingEntry,
  RankingPeriod,
  RankingResponse,
  RankingType,
} from '../models/ranking-entry.model';

const HOME_HIGHLIGHT_SIZE = 10;
const PAGE_SIZE = 25;

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly http = inject(HttpClient);

  /** Cache por (tipo, período): trocar de aba de novo não refaz a chamada. */
  private readonly cache = new Map<string, readonly RankingEntry[]>();

  private readonly entriesState = signal<readonly RankingEntry[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly entries = this.entriesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  private readonly weeklyHighlightState = signal<readonly RankingEntry[]>([]);
  private readonly weeklyHighlightLoadingState = signal(false);

  /** Ranking da semana (pontos + sequência), destaque da Home. */
  readonly weeklyHighlight = this.weeklyHighlightState.asReadonly();
  readonly weeklyHighlightLoading = this.weeklyHighlightLoadingState.asReadonly();

  load(type: RankingType, period: RankingPeriod): void {
    const cached = this.cache.get(this.keyOf(type, period));
    if (cached) {
      this.entriesState.set(cached);
      this.errorState.set(null);
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);
    this.fetch(type, period, PAGE_SIZE)
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (entries) => this.entriesState.set(entries),
        error: (error: HttpErrorResponse) =>
          this.errorState.set(
            resolveApiErrorMessage(error, 'Não foi possível carregar o ranking.'),
          ),
      });
  }

  loadWeeklyHighlight(): void {
    if (this.weeklyHighlightState().length > 0) {
      return;
    }
    this.weeklyHighlightLoadingState.set(true);
    this.fetch('combined', 'week', HOME_HIGHLIGHT_SIZE)
      .pipe(finalize(() => this.weeklyHighlightLoadingState.set(false)))
      .subscribe({
        next: (entries) => this.weeklyHighlightState.set(entries),
        // A Home não deve quebrar por causa do ranking: sem dados, a seção
        // simplesmente mostra o estado vazio.
        error: () => of([]),
      });
  }

  private fetch(
    type: RankingType,
    period: RankingPeriod,
    limit: number,
  ): Observable<readonly RankingEntry[]> {
    const params = new HttpParams({ fromObject: { type, period, limit } });
    return this.http
      .get<ApiEnvelope<RankingResponse>>(`${environment.apiBaseUrl}/api/v1/rankings/`, {
        params,
      })
      .pipe(
        map((response) => response.data.entries),
        tap((entries) => {
          if (limit === PAGE_SIZE) {
            this.cache.set(this.keyOf(type, period), entries);
          }
        }),
      );
  }

  private keyOf(type: RankingType, period: RankingPeriod): string {
    return `${type}:${period}`;
  }
}
