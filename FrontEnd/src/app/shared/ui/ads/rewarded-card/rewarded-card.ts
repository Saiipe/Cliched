import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../../button/button';
import { Icon } from '../../icon/icon';
import { IconVideo } from '@tabler/icons-angular';

@Component({
  selector: 'app-rewarded-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  template: `
    <div class="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center">
      <p class="text-sm text-muted">Assista um anúncio para receber: {{ rewardLabel() }}</p>
      <app-button variant="primary" [disabled]="loading()" (click)="watch.emit()">
        <app-icon [icon]="videoIcon" [size]="16" />
        {{ loading() ? 'Carregando...' : 'Assistir anúncio' }}
      </app-button>
    </div>
  `,
})
export class RewardedCard {
  readonly rewardLabel = input.required<string>();
  readonly loading = input<boolean>(false);
  readonly watch = output<void>();

  protected readonly videoIcon = IconVideo;
}
