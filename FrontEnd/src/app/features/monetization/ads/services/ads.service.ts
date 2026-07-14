import { Injectable, inject } from '@angular/core';
import { PremiumService } from '../../premium/services/premium.service';
import { AdFormat } from '../enums/ad-format.enum';
import type { AdPlacement } from '../enums/ad-placement.enum';
import type { AdUnit } from '../models/ad-unit.model';
import type { RewardedAdResult } from '../models/rewarded-ad-result.model';

/**
 * Único ponto de decisão sobre qual provedor de anúncio é usado e se um
 * anúncio deve ser exibido. Nenhum outro módulo deve saber que provedor
 * está por trás — hoje nenhum está integrado, então os métodos retornam
 * vazio/no-op de propósito. Trocar por Google Ads/Ad Manager/Amazon
 * Ads/Microsoft Ads/Unity Ads no futuro não deve exigir mudanças em quem
 * consome este serviço.
 */
@Injectable({ providedIn: 'root' })
export class AdsService {
  private readonly premiumService = inject(PremiumService);

  getBannerAd(placement: AdPlacement, format: AdFormat = AdFormat.BannerHorizontal): AdUnit | null {
    if (this.premiumService.isPremium()) {
      return null;
    }

    // TODO: integrar com um provedor real (Google Ads, Google Ad Manager,
    // Amazon Ads, Microsoft Ads, Unity Ads...). Por enquanto, sem provedor.
    void placement;
    void format;
    return null;
  }

  requestInterstitial(): Promise<void> {
    if (this.premiumService.isPremium()) {
      return Promise.resolve();
    }

    // TODO: solicitar interstitial ao provedor real.
    return Promise.resolve();
  }

  requestRewardedAd(): Promise<RewardedAdResult> {
    // TODO: solicitar rewarded ad ao provedor real e resolver `granted: true`
    // somente quando o usuário assistir até o fim.
    return Promise.resolve({ granted: false });
  }
}
