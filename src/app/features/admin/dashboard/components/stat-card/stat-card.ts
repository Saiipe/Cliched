import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../../../../../shared/ui/icon/icon';
import type { DashboardStat } from '../../models/dashboard-stat.model';

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <article class="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted">{{ stat().label }}</span>
        <app-icon [icon]="stat().icon" [size]="18" class="text-muted" />
      </div>
      <p class="text-3xl font-bold text-foreground">{{ stat().value }}</p>
    </article>
  `,
})
export class StatCard {
  readonly stat = input.required<DashboardStat>();
}
