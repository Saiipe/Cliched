import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconFlame, IconTrophy } from '@tabler/icons-angular';
import { RankingService } from '../../../ranking/services/ranking.service';
import { Icon } from '../../../../shared/ui/icon/icon';
import { formatThousands } from '../../../../shared/utils/format-number.util';

@Component({
  selector: 'app-ranking-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-16">
      <div class="flex items-end justify-between">
        <div>
          <h2 class="text-2xl font-bold text-foreground">Ranking da semana</h2>
          <p class="mt-1 text-muted">Os melhores cinéfilos da comunidade.</p>
        </div>
        <a routerLink="/ranking" class="text-sm text-foreground hover:underline">Ver tudo</a>
      </div>

      <div class="mt-8 overflow-hidden rounded-2xl border border-border">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-border text-xs uppercase text-muted">
              <th scope="col" class="px-6 py-3 font-medium">#</th>
              <th scope="col" class="px-6 py-3 font-medium">Jogador</th>
              <th scope="col" class="px-6 py-3 text-right font-medium">Pontos</th>
              <th scope="col" class="px-6 py-3 text-right font-medium">Sequência</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of rankingService.getWeeklyRanking()(); track entry.position) {
              <tr class="border-b border-border text-sm last:border-0">
                <td class="px-6 py-4 text-foreground">
                  <span class="inline-flex items-center gap-1.5">
                    @if (entry.position <= 3) {
                      <app-icon [icon]="trophyIcon" [size]="14" />
                    }
                    {{ entry.position }}
                  </span>
                </td>
                <td class="px-6 py-4 text-foreground">{{ entry.playerName }}</td>
                <td class="px-6 py-4 text-right text-foreground">
                  {{ formatThousands(entry.points) }}
                </td>
                <td class="px-6 py-4 text-right text-muted">
                  <span class="inline-flex items-center justify-end gap-1.5">
                    <app-icon [icon]="flameIcon" [size]="14" />
                    {{ entry.streak }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class RankingPreview {
  protected readonly rankingService = inject(RankingService);
  protected readonly trophyIcon = IconTrophy;
  protected readonly flameIcon = IconFlame;
  protected readonly formatThousands = formatThousands;
}
