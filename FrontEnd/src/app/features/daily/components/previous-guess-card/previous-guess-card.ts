import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { IconChevronDown } from '@tabler/icons-angular';

import { Icon } from '../../../../shared/ui/icon/icon';
import { GuessCluesGrid } from '../guess-clues/guess-clues';
import type { ClueResult, DailyPreviousGuess, GuessClues } from '../../models/daily-session.model';

interface ClueDot {
  readonly label: string;
  readonly result: ClueResult;
}

const DOT_STYLES: Record<ClueResult, string> = {
  correct: 'bg-success',
  partial: 'bg-warning',
  wrong: 'bg-error',
};

function hasClues(clues: GuessClues | Record<string, never>): clues is GuessClues {
  return Object.keys(clues).length > 0;
}

@Component({
  selector: 'app-previous-guess-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, GuessCluesGrid],
  template: `
    <div class="rounded-2xl border border-border bg-bg">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        [class.cursor-default]="!hasDetails()"
        (click)="toggle()"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-xs uppercase tracking-[0.18em] text-muted">
              Tentativa {{ guess().attempt_number }}
            </span>
            <span
              class="rounded-full px-2 py-0.5 text-[0.65rem] font-medium"
              [class]="guess().is_correct ? 'bg-success/10 text-success' : 'bg-error/10 text-error'"
            >
              {{ guess().is_correct ? 'Acerto' : 'Erro' }}
            </span>
          </div>
          <p class="mt-1 truncate text-sm font-medium text-foreground">{{ guess().title }}</p>
        </div>

        @if (dots(); as dotList) {
          <div class="flex shrink-0 items-center gap-1">
            @for (dot of dotList; track dot.label) {
              <span class="size-2.5 rounded-full" [class]="dotStyles[dot.result]" [attr.title]="dot.label"></span>
            }
          </div>
        }

        @if (hasDetails()) {
          <app-icon
            [icon]="chevronIcon"
            [size]="16"
            class="shrink-0 text-muted transition-transform"
            [class.rotate-180]="expanded()"
          />
        }
      </button>

      @if (expanded() && clues(); as clueData) {
        <div class="border-t border-border px-4 py-3">
          <app-guess-clues [clues]="clueData" />
        </div>
      }
    </div>
  `,
})
export class PreviousGuessCard {
  readonly guess = input.required<DailyPreviousGuess>();

  protected readonly expanded = signal(false);
  protected readonly dotStyles = DOT_STYLES;
  protected readonly chevronIcon = IconChevronDown;

  protected readonly clues = computed<GuessClues | null>(() => {
    const clues = this.guess().clues;
    return hasClues(clues) ? clues : null;
  });

  protected readonly hasDetails = computed(() => this.clues() !== null);

  protected readonly dots = computed<readonly ClueDot[] | null>(() => {
    const clues = this.clues();
    if (!clues) {
      return null;
    }

    return [
      { label: `Ano: ${clues.release_year.value ?? '—'}`, result: clues.release_year.result },
      {
        label: `Gêneros: ${clues.genres.value.map((genre) => genre.name).join(', ') || '—'}`,
        result: clues.genres.result,
      },
      { label: `País: ${clues.country.value ?? '—'}`, result: clues.country.result },
      { label: `Diretor: ${clues.director.value ?? '—'}`, result: clues.director.result },
      {
        label: `Elenco: ${clues.cast.value.slice(0, 3).join(', ') || '—'}`,
        result: clues.cast.result,
      },
      {
        label: `Duração: ${clues.runtime.value ? clues.runtime.value + ' min' : '—'}`,
        result: clues.runtime.result,
      },
    ];
  });

  protected toggle(): void {
    if (this.hasDetails()) {
      this.expanded.update((value) => !value);
    }
  }
}
