import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RankingTable } from '../../../ranking/components/ranking-table/ranking-table';
import { RankingService } from '../../../ranking/services/ranking.service';

const PREVIEW_SIZE = 5;

@Component({
  selector: 'app-ranking-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RankingTable],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-16">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-foreground">Ranking da semana</h2>
          <p class="mt-1 text-muted">Os melhores cinéfilos da comunidade.</p>
        </div>
        <a routerLink="/ranking" class="text-sm text-foreground hover:underline">Ver tudo</a>
      </div>

      <div class="mt-8">
        <app-ranking-table [entries]="topEntries()" />
      </div>
    </section>
  `,
})
export class RankingPreview {
  private readonly rankingService = inject(RankingService);

  protected readonly topEntries = computed(() =>
    this.rankingService.getWeeklyRanking()().slice(0, PREVIEW_SIZE),
  );
}
