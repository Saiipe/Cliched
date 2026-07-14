import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TablerIconComponent, type TablerIcon } from '@tabler/icons-angular';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TablerIconComponent],
  template: `<tabler-icon [icon]="icon()" [size]="size()" [stroke]="strokeWidth()" />`,
  host: {
    class: 'inline-flex',
    '[attr.aria-hidden]': '"true"',
    ngSkipHydration: 'true',
  },
})
export class Icon {
  readonly icon = input.required<TablerIcon>();
  readonly size = input<number>(20);
  readonly strokeWidth = input<number>(2);
}
