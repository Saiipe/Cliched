import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';
import type { GameMode } from '../../models/game-mode.model';

@Component({
  selector: 'app-game-mode-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Button, Icon, RouterLink],
  template: `
    <article
      class="relative flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-all hover:border-secondary/60 hover:shadow-[0_0_24px_-4px_var(--secondary)]"
    >
      @if (gameMode().status === 'coming-soon') {
        <app-badge variant="muted" class="absolute right-6 top-6">Em breve</app-badge>
      }

      <div class="flex size-11 items-center justify-center rounded-lg bg-surface-elevated">
        <app-icon [icon]="gameMode().icon" [size]="20" />
      </div>

      <div class="flex flex-col gap-1.5">
        <h3 class="text-base font-semibold text-foreground">{{ gameMode().title }}</h3>
        <p class="text-sm text-muted">{{ gameMode().description }}</p>
      </div>

      @if (gameMode().status === 'available') {
        <a
          [routerLink]="gameMode().route"
          class="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Jogar
        </a>
      } @else {
        <app-button class="mt-auto" [fullWidth]="true" [variant]="'secondary'" [disabled]="true">
          Em breve
        </app-button>
      }
    </article>
  `,
})
export class GameModeCard {
  readonly gameMode = input.required<GameMode>();
}
