import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      class="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50"
      [class]="buttonClass()"
    >
      <ng-content />
    </button>
  `,
  host: {
    '[class.block]': 'fullWidth()',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);

  protected readonly buttonClass = computed(() => {
    const variantClass = this.variantClasses();
    return this.fullWidth() ? `${variantClass} w-full` : variantClass;
  });

  private readonly variantClasses = computed(() => {
    switch (this.variant()) {
      case 'secondary':
        return 'bg-surface text-foreground border border-border hover:bg-surface-elevated focus-visible:ring-border';
      case 'ghost':
        return 'bg-transparent text-foreground hover:bg-surface focus-visible:ring-border';
      case 'primary':
      default:
        return 'bg-foreground text-bg hover:opacity-90 focus-visible:ring-foreground';
    }
  });
}
