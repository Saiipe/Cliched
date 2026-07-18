export type RankingType = 'streak' | 'points' | 'combined';

export type RankingPeriod = 'week' | 'month' | 'all';

export interface RankingEntry {
  readonly position: number;
  readonly player_name: string;
  readonly points: number;
  readonly streak: number;
  readonly is_real: boolean;
}

export interface RankingResponse {
  readonly type: RankingType;
  readonly period: RankingPeriod;
  readonly entries: readonly RankingEntry[];
}
