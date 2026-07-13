import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      class="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] px-4 py-2 text-sm font-medium
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50"
      [class]="variantClass()"
    >
      <ng-content />
    </button>
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);

  protected readonly variantClass = computed(() => {
    switch (this.variant()) {
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:opacity-90 focus-visible:ring-secondary';
      case 'ghost':
        return 'bg-transparent text-foreground hover:bg-surface focus-visible:ring-border';
      case 'primary':
      default:
        return 'bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-primary';
    }
  });
}
