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
    <div class="overflow-x-auto rounded-2xl border border-border">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-border text-xs uppercase text-muted">
            <th scope="col" class="px-3 py-3 font-medium sm:px-6">#</th>
            <th scope="col" class="px-3 py-3 font-medium sm:px-6">Jogador</th>
            <th scope="col" class="px-3 py-3 text-right font-medium sm:px-6">Pontos</th>
            <th scope="col" class="hidden px-3 py-3 text-right font-medium sm:table-cell sm:px-6">
              Sequência
            </th>
          </tr>
        </thead>
        <tbody>
          @for (entry of entries(); track entry.position) {
            <tr class="border-b border-border text-sm transition-colors last:border-0 hover:bg-surface-elevated">
              <td class="px-3 py-4 text-foreground sm:px-6">
                <span class="inline-flex items-center gap-1.5">
                  @if (entry.position <= 3) {
                    <app-icon [icon]="trophyIcon" [size]="14" />
                  }
                  {{ entry.position }}
                </span>
              </td>
              <td class="px-3 py-4 text-foreground sm:px-6">{{ entry.playerName }}</td>
              <td class="px-3 py-4 text-right text-foreground sm:px-6">
                {{ formatThousands(entry.points) }}
              </td>
              <td class="hidden px-3 py-4 text-right text-muted sm:table-cell sm:px-6">
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
