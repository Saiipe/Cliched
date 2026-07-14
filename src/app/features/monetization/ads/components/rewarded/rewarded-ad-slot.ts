import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { AdsService } from '../../../../../core/services/ads.service';
import { RewardedCard } from '../../../../../shared/ui/ads/rewarded-card/rewarded-card';
import { RewardType } from '../../../rewards/models/reward-type.enum';
import { RewardsService } from '../../../rewards/services/rewards.service';

/**
 * Componente pronto pra qualquer feature de jogo usar: pede o rewarded ad via
 * `AdsService`, e se concedido, aciona o `RewardsService` (que sabe entregar
 * moedas sozinho; para dica/partida extra/desbloqueio, quem escuta
 * `rewardGranted` é a própria feature que pediu a recompensa).
 */
@Component({
  selector: 'app-rewarded-ad-slot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RewardedCard],
  template: `
    <app-rewarded-card [rewardLabel]="rewardLabel()" [loading]="loading()" (watch)="onWatch()" />
  `,
})
export class RewardedAdSlot {
  readonly rewardLabel = input.required<string>();
  readonly rewardType = input.required<RewardType>();
  readonly coinsAmount = input<number>();
  readonly rewardGranted = output<boolean>();

  private readonly adsService = inject(AdsService);
  private readonly rewardsService = inject(RewardsService);

  protected readonly loading = signal(false);

  protected async onWatch(): Promise<void> {
    this.loading.set(true);
    const result = await this.adsService.showRewardedAd();
    this.loading.set(false);

    if (result.granted) {
      this.rewardsService.grantReward(this.rewardType(), this.coinsAmount());
    }

    this.rewardGranted.emit(result.granted);
  }
}
