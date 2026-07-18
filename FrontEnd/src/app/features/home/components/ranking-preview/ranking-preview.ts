import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RankingTable } from '../../../ranking/components/ranking-table/ranking-table';
import { RankingService } from '../../../ranking/services/ranking.service';

@Component({
  selector: 'app-ranking-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RankingTable],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-16">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-foreground">Ranking da semana</h2>
          <p class="mt-1 text-muted">Top 10 da semana por pontos e sequência.</p>
        </div>
        <a routerLink="/ranking" class="text-sm text-foreground hover:underline">Ver tudo</a>
      </div>

      <div class="mt-8">
        @if (rankingService.weeklyHighlightLoading()) {
          <p class="py-8 text-center text-sm text-muted" role="status">Carregando ranking...</p>
        } @else {
          <app-ranking-table [entries]="rankingService.weeklyHighlight()" />
        }
      </div>
    </section>
  `,
})
export class RankingPreview implements OnInit {
  protected readonly rankingService = inject(RankingService);

  ngOnInit(): void {
    this.rankingService.loadWeeklyHighlight();
  }
}
