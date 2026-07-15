import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconChevronDown } from '@tabler/icons-angular';

import { Badge } from '../../../../../shared/ui/badge/badge';
import { Icon } from '../../../../../shared/ui/icon/icon';
import type { GameMode } from '../../../../catalog/models/game-mode.model';
import {
  ADMIN_GAME_OPTIONS,
  DEFAULT_ADMIN_GAME_OPTIONS,
} from '../../models/admin-game-options.mock';

@Component({
  selector: 'app-admin-game-mode-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Icon, RouterLink],
  template: `
    <article class="rounded-2xl border border-border bg-surface transition-colors hover:border-muted">
      <button
        type="button"
        class="flex w-full items-center gap-4 p-6 text-left"
        (click)="toggle()"
      >
        <div class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
          <app-icon [icon]="gameMode().icon" [size]="20" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h3 class="text-base font-semibold text-foreground">{{ gameMode().title }}</h3>
            @if (gameMode().status === 'coming-soon') {
              <app-badge variant="muted">Em breve</app-badge>
            }
          </div>
          <p class="mt-1 truncate text-sm text-muted">{{ gameMode().description }}</p>
        </div>

        <app-icon
          [icon]="chevronIcon"
          [size]="18"
          class="shrink-0 text-muted transition-transform"
          [class.rotate-180]="expanded()"
        />
      </button>

      @if (expanded()) {
        <div class="space-y-2 border-t border-border p-4">
          @for (option of options(); track option.label) {
            @if (option.route) {
              <a
                [routerLink]="option.route"
                class="flex items-center justify-between rounded-xl bg-bg px-4 py-3 text-sm font-medium text-foreground transition hover:bg-surface-elevated"
              >
                {{ option.label }}
              </a>
            } @else {
              <span
                class="flex items-center justify-between rounded-xl bg-bg px-4 py-3 text-sm text-muted/60"
                aria-disabled="true"
              >
                {{ option.label }}
              </span>
            }
          }
        </div>
      }
    </article>
  `,
})
export class AdminGameModeCard {
  readonly gameMode = input.required<GameMode>();

  protected readonly expanded = signal(false);
  protected readonly chevronIcon = IconChevronDown;

  protected readonly options = computed(
    () => ADMIN_GAME_OPTIONS[this.gameMode().id] ?? DEFAULT_ADMIN_GAME_OPTIONS,
  );

  protected toggle(): void {
    this.expanded.update((value) => !value);
  }
}
