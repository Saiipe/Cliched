import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconFlame, IconTrophy } from '@tabler/icons-angular';
import { Icon } from '../../../../shared/ui/icon/icon';
import { formatThousands } from '../../../../shared/utils/format-number.util';
import type { RankingEntry } from '../../models/ranking-entry.model';

@Component({
  selector: 'app-ranking-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="overflow-hidden rounded-2xl border border-border">
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
          @for (entry of entries(); track entry.position) {
            <tr class="border-b border-border text-sm transition-colors last:border-0 hover:bg-surface-elevated">
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
  `,
})
export class RankingTable {
  readonly entries = input.required<readonly RankingEntry[]>();

  protected readonly trophyIcon = IconTrophy;
  protected readonly flameIcon = IconFlame;
  protected readonly formatThousands = formatThousands;
}
