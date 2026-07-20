import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { IconDeviceGamepad2, IconMovie, IconTarget, IconUsers } from '@tabler/icons-angular';

import { environment } from '../../../../../environments/environment';
import type { ApiEnvelope } from '../../../daily/models/daily-session.model';
import type { ChartPoint } from '../models/chart-point.model';
import type { DashboardStat } from '../models/dashboard-stat.model';

interface DashboardStatsResponse {
  readonly players_count: number;
  readonly movies_count: number;
  readonly matches_today: number;
  readonly average_accuracy: number;
  readonly matches_trend: readonly ChartPoint[];
  readonly game_modes_popularity: readonly ChartPoint[];
}

const EMPTY_TREND: readonly ChartPoint[] = [];

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  private readonly response = signal<DashboardStatsResponse | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly stats = computed<readonly DashboardStat[]>(() => {
    const data = this.response();
    if (!data) {
      return [];
    }
    return [
      { label: 'Jogadores', value: data.players_count.toLocaleString('pt-BR'), icon: IconUsers },
      { label: 'Filmes no catálogo', value: data.movies_count.toLocaleString('pt-BR'), icon: IconMovie },
      { label: 'Partidas hoje', value: data.matches_today.toLocaleString('pt-BR'), icon: IconDeviceGamepad2 },
      { label: 'Acerto médio', value: `${data.average_accuracy}%`, icon: IconTarget },
    ];
  });

  readonly matchesTrend = computed<readonly ChartPoint[]>(
    () => this.response()?.matches_trend ?? EMPTY_TREND,
  );

  readonly gameModesPopularity = computed<readonly ChartPoint[]>(
    () => this.response()?.game_modes_popularity ?? EMPTY_TREND,
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.http
      .get<ApiEnvelope<DashboardStatsResponse>>(`${environment.apiBaseUrl}/api/v1/metrics/dashboard/`)
      .subscribe({
        next: (envelope) => {
          this.response.set(envelope.data);
          this.loadingState.set(false);
        },
        error: () => {
          this.errorState.set('Não foi possível carregar as estatísticas do dashboard.');
          this.loadingState.set(false);
        },
      });
  }
}
