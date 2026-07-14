import { Injectable, signal } from '@angular/core';
import { WEEKLY_RANKING_MOCK } from '../mocks/ranking.mock';
import type { RankingEntry } from '../models/ranking-entry.model';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly weeklyRanking = signal<readonly RankingEntry[]>(WEEKLY_RANKING_MOCK);

  getWeeklyRanking() {
    return this.weeklyRanking.asReadonly();
  }
}
