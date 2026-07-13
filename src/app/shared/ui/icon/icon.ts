import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideDynamicIcon, type LucideIconInput } from '@lucide/angular';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideDynamicIcon],
  template: `<svg [lucideIcon]="icon()" [size]="size()" [strokeWidth]="strokeWidth()"></svg>`,
  host: {
    class: 'inline-flex',
    '[attr.aria-hidden]': '"true"',
  },
})
export class Icon {
  readonly icon = input.required<LucideIconInput>();
  readonly size = input<number>(20);
  readonly strokeWidth = input<number>(2);
}
