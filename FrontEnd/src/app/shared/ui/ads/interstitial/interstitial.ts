import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { IconAd, IconX } from '@tabler/icons-angular';
import { Button } from '../../button/button';
import { Icon } from '../../icon/icon';

@Component({
  selector: 'app-interstitial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  template: `
    <div
      class="flex w-80 max-w-full flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-8 text-center"
    >
      <app-icon [icon]="adIcon" [size]="32" />
      <p class="text-sm text-muted">Anúncio</p>
      <app-button variant="ghost" (click)="dismissed.emit()">
        <app-icon [icon]="closeIcon" [size]="16" />
        Fechar
      </app-button>
    </div>
  `,
})
export class Interstitial {
  readonly dismissed = output<void>();

  protected readonly adIcon = IconAd;
  protected readonly closeIcon = IconX;
}
