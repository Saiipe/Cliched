import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeVariant = 'outline' | 'muted';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      [class]="variantClass()"
    >
      <ng-content />
    </span>
  `,
})
export class Badge {
  readonly variant = input<BadgeVariant>('outline');

  protected readonly variantClass = computed(() =>
    this.variant() === 'muted'
      ? 'bg-surface text-muted'
      : 'border border-border text-foreground',
  );
}
