import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-angular';

import { Icon } from '../../../../shared/ui/icon/icon';
import type { ClueResult, GuessClues } from '../../models/daily-session.model';

interface ClueChip {
  readonly label: string;
  readonly text: string;
  readonly result: ClueResult;
  readonly direction?: 'up' | 'down';
}

const CLUE_STYLES: Record<ClueResult, string> = {
  correct: 'border-success/40 bg-success/10 text-success',
  partial: 'border-warning/40 bg-warning/10 text-warning',
  wrong: 'border-error/30 bg-error/10 text-error',
};

@Component({
  selector: 'app-guess-clues',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="grid grid-cols-2 gap-2">
      @for (chip of chips(); track chip.label) {
        <div class="rounded-xl border px-3 py-2" [class]="clueStyles[chip.result]">
          <p class="text-[0.65rem] uppercase tracking-[0.16em] opacity-80">{{ chip.label }}</p>
          <p class="mt-1 flex items-start gap-1 text-sm font-medium">
            <span class="break-words">{{ chip.text }}</span>
            @if (chip.direction === 'up') {
              <app-icon [icon]="arrowUp" [size]="14" class="mt-0.5 shrink-0" />
            } @else if (chip.direction === 'down') {
              <app-icon [icon]="arrowDown" [size]="14" class="mt-0.5 shrink-0" />
            }
          </p>
        </div>
      }
    </div>
  `,
})
export class GuessCluesGrid {
  readonly clues = input.required<GuessClues>();

  protected readonly arrowUp = IconArrowUp;
  protected readonly arrowDown = IconArrowDown;
  protected readonly clueStyles = CLUE_STYLES;

  protected readonly chips = computed<readonly ClueChip[]>(() => {
    const clues = this.clues();
    return [
      {
        label: 'Ano',
        text: clues.release_year.value?.toString() ?? '—',
        result: clues.release_year.result,
        direction: clues.release_year.direction,
      },
      {
        label: 'Gêneros',
        text: clues.genres.value.map((genre) => genre.name).join(', ') || '—',
        result: clues.genres.result,
      },
      {
        label: 'País',
        text: clues.country.value ?? '—',
        result: clues.country.result,
      },
      {
        label: 'Diretor',
        text: clues.director.value ?? '—',
        result: clues.director.result,
      },
      {
        label: 'Elenco',
        text: clues.cast.value.slice(0, 3).join(', ') || '—',
        result: clues.cast.result,
      },
      {
        label: 'Duração',
        text: clues.runtime.value ? `${clues.runtime.value} min` : '—',
        result: clues.runtime.result,
        direction: clues.runtime.direction,
      },
    ];
  });
}
