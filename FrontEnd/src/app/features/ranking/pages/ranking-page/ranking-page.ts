import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RankingTable } from '../../components/ranking-table/ranking-table';
import { RankingService } from '../../services/ranking.service';

@Component({
  selector: 'app-ranking-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RankingTable],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-16">
      <h1 class="text-4xl font-bold text-foreground">Ranking</h1>
      <p class="mt-3 text-muted">Os melhores cinéfilos da comunidade.</p>

      <div class="mt-8">
        <app-ranking-table [entries]="rankingService.getWeeklyRanking()()" />
      </div>
    </section>
  `,
})
export class RankingPage {
  protected readonly rankingService = inject(RankingService);
}
