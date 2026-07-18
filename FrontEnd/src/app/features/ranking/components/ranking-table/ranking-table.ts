import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconFlame, IconInfoCircle, IconTrophy } from '@tabler/icons-angular';
import { Icon } from '../../../../shared/ui/icon/icon';
import { Tooltip } from '../../../../shared/ui/tooltip/tooltip';
import { formatPoints } from '../../../../shared/utils/format-number.util';
import type { RankingEntry } from '../../models/ranking-entry.model';

const MEDAL_CLASS_BY_POSITION: Record<number, string> = {
  1: 'text-[#f5cc4d] font-bold',
  2: 'text-[#d6d9dd] font-bold',
  3: 'text-[#c9814a] font-bold',
};

@Component({
  selector: 'app-ranking-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Tooltip],
  template: `
    <div class="rounded-2xl border border-border">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-border text-[0.65rem] uppercase text-muted sm:text-xs">
            <th scope="col" class="px-2 py-2.5 font-medium sm:px-6 sm:py-3">#</th>
            <th scope="col" class="px-2 py-2.5 font-medium sm:px-6 sm:py-3">Jogador</th>
            <th scope="col" class="px-2 py-2.5 text-right font-medium sm:px-6 sm:py-3">Pontos</th>
            <th scope="col" class="px-1.5 py-2.5 text-right font-medium sm:px-6 sm:py-3">
              <div class="flex justify-end">
                <app-tooltip
                  text="Sequência é a quantidade de vitórias em dias seguidos no desafio diário. Quando várias pessoas empatam na maior sequência, o fogo delas fica aceso."
                >
                  <span class="inline-flex items-center gap-1">
                    <span class="hidden sm:inline">Sequência</span>
                    <app-icon [icon]="flameIcon" [size]="13" class="text-muted sm:hidden" />
                    <app-icon [icon]="infoIcon" [size]="14" class="text-muted" />
                  </span>
                </app-tooltip>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          @for (entry of entries(); track entry.position) {
            <tr class="border-b border-border text-xs transition-colors last:border-0 hover:bg-surface-elevated sm:text-sm">
              <td class="px-2 py-2.5 text-foreground sm:px-6 sm:py-4">
                <span class="inline-flex items-center gap-1 sm:gap-1.5" [class]="medalClass(entry.position)">
                  @if (entry.position <= 3) {
                    <app-icon [icon]="trophyIcon" [size]="13" />
                  }
                  {{ entry.position }}
                </span>
              </td>
              <td class="max-w-0 px-2 py-2.5 sm:max-w-none sm:px-6 sm:py-4">
                <span
                  class="block truncate"
                  [class]="medalClass(entry.position) || 'text-foreground'"
                  >{{ entry.player_name }}</span
                >
              </td>
              <td class="px-2 py-2.5 text-right text-foreground sm:px-6 sm:py-4">
                {{ formatPoints(entry.points) }}
              </td>
              <td
                class="px-1.5 py-2.5 text-right sm:px-6 sm:py-4"
                [class]="isTopStreak(entry) ? 'text-secondary' : 'text-muted'"
              >
                <span class="inline-flex items-center justify-end gap-1 sm:gap-1.5">
                  <app-icon
                    [icon]="flameIcon"
                    [size]="13"
                    [class]="isTopStreak(entry) ? 'text-secondary' : 'text-muted'"
                  />
                  {{ entry.streak }}
                </span>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="4" class="px-3 py-6 text-center text-sm text-muted sm:px-6">
                Ninguém pontuou neste período ainda. Jogue hoje e abra o placar!
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
  protected readonly infoIcon = IconInfoCircle;
  protected readonly formatPoints = formatPoints;

  /** Maior sequência entre os jogadores visíveis nesta lista: todos que
   * empatam nela (não só o 1º colocado) têm o "fogo" aceso na coluna
   * Sequência. */
  private readonly topStreak = computed(() =>
    Math.max(0, ...this.entries().map((entry) => entry.streak)),
  );

  protected isTopStreak(entry: RankingEntry): boolean {
    const top = this.topStreak();
    return top > 0 && entry.streak === top;
  }

  protected medalClass(position: number): string {
    return MEDAL_CLASS_BY_POSITION[position] ?? '';
  }
}
