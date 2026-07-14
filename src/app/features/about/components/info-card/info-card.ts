import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../../../../shared/ui/icon/icon';
import type { AboutHighlight } from '../../models/about-highlight.model';

@Component({
  selector: 'app-info-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <article class="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div class="flex size-11 items-center justify-center rounded-lg bg-surface-elevated">
        <app-icon [icon]="highlight().icon" [size]="20" />
      </div>

      <div class="flex flex-col gap-1.5">
        <h3 class="text-base font-semibold text-foreground">{{ highlight().title }}</h3>
        <p class="text-sm text-muted">{{ highlight().description }}</p>
      </div>
    </article>
  `,
})
export class InfoCard {
  readonly highlight = input.required<AboutHighlight>();
}
