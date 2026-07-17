import { Injectable, inject, signal } from '@angular/core';
import { CoinsService } from '../../coins/services/coins.service';
import { RewardType } from '../models/reward-type.enum';

export interface GrantedReward {
  readonly type: RewardType;
  readonly sequence: number;
}

/**
 * Ponto único para conceder recompensas (dica, partida extra, moedas,
 * desbloqueio de conteúdo), tipicamente após um `AdsService.requestRewardedAd()`
 * bem-sucedido. Moedas são resolvidas aqui mesmo (via CoinsService, no mesmo
 * domínio de monetização); os demais tipos só são anunciados via
 * `getLastGrantedReward()`. Quem sabe o que fazer com "Hint"/"ExtraPlay"/
 * "UnlockContent" é a feature de jogo que pediu a recompensa, não este service.
 */
@Injectable({ providedIn: 'root' })
export class RewardsService {
  private readonly coinsService = inject(CoinsService);
  private readonly lastGrantedReward = signal<GrantedReward | null>(null);
  private sequence = 0;

  getLastGrantedReward() {
    return this.lastGrantedReward.asReadonly();
  }

  grantReward(type: RewardType, coinsAmount?: number): void {
    if (type === RewardType.Coins) {
      this.coinsService.addCoins(coinsAmount ?? 0);
    }

    this.sequence += 1;
    this.lastGrantedReward.set({ type, sequence: this.sequence });
  }
}
