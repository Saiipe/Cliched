import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RankingTable } from '../../components/ranking-table/ranking-table';
import type { RankingPeriod, RankingType } from '../../models/ranking-entry.model';
import { RankingService } from '../../services/ranking.service';

const TYPE_TABS: readonly { value: RankingType; label: string }[] = [
  { value: 'combined', label: 'Pontos + Sequência' },
  { value: 'points', label: 'Pontos' },
  { value: 'streak', label: 'Sequência' },
];

const PERIOD_FILTERS: readonly { value: RankingPeriod; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'all', label: 'Geral' },
];

@Component({
  selector: 'app-ranking-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RankingTable],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-16">
      <h1 class="text-4xl font-bold text-foreground">Ranking</h1>
      <p class="mt-3 text-muted">Os melhores cinéfilos da comunidade.</p>

      <div
        role="tablist"
        aria-label="Tipo de ranking"
        class="mt-8 flex flex-nowrap gap-2 overflow-x-auto border-b border-border pb-px scroll-smooth"
      >
        @for (tab of typeTabs; track tab.value) {
          <button
            type="button"
            role="tab"
            [id]="'ranking-tab-' + tab.value"
            [attr.aria-selected]="type() === tab.value"
            [attr.aria-controls]="'ranking-panel'"
            class="-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
            [class.border-foreground]="type() === tab.value"
            [class.text-foreground]="type() === tab.value"
            [class.border-transparent]="type() !== tab.value"
            [class.text-muted]="type() !== tab.value"
            [class.hover:text-foreground]="type() !== tab.value"
            [class.shrink-0]="true"
            (click)="selectType(tab.value)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-2" aria-label="Período">
        @for (filter of periodFilters; track filter.value) {
          <button
            type="button"
            [attr.aria-pressed]="period() === filter.value"
            class="rounded-full border px-4 py-1.5 text-sm transition-colors"
            [class.border-foreground]="period() === filter.value"
            [class.bg-foreground]="period() === filter.value"
            [class.text-bg]="period() === filter.value"
            [class.border-border]="period() !== filter.value"
            [class.text-muted]="period() !== filter.value"
            [class.hover:text-foreground]="period() !== filter.value"
            (click)="selectPeriod(filter.value)"
          >
            {{ filter.label }}
          </button>
        }
      </div>

      <div
        id="ranking-panel"
        role="tabpanel"
        [attr.aria-labelledby]="'ranking-tab-' + type()"
        class="mt-8"
      >
        @if (rankingService.loading()) {
          <p class="py-8 text-center text-sm text-muted" role="status">Carregando ranking...</p>
        } @else if (rankingService.error()) {
          <p class="py-8 text-center text-sm text-error" role="alert">
            {{ rankingService.error() }}
          </p>
        } @else {
          <app-ranking-table [entries]="rankingService.entries()" />
        }
      </div>
    </section>
  `,
})
export class RankingPage implements OnInit {
  protected readonly rankingService = inject(RankingService);

  protected readonly typeTabs = TYPE_TABS;
  protected readonly periodFilters = PERIOD_FILTERS;

  protected readonly type = signal<RankingType>('combined');
  protected readonly period = signal<RankingPeriod>('week');

  ngOnInit(): void {
    this.rankingService.load(this.type(), this.period());
  }

  protected selectType(type: RankingType): void {
    this.type.set(type);
    this.rankingService.load(type, this.period());
  }

  protected selectPeriod(period: RankingPeriod): void {
    this.period.set(period);
    this.rankingService.load(this.type(), period);
  }
}
