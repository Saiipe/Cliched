import { Injectable, inject } from '@angular/core';
import { PremiumService } from '../../premium/services/premium.service';
import { AdFormat } from '../enums/ad-format.enum';
import type { AdPlacement } from '../enums/ad-placement.enum';
import type { AdUnit } from '../models/ad-unit.model';
import type { RewardedAdResult } from '../models/rewarded-ad-result.model';

/**
 * ID do bloco de anúncio no AdSense por posição+formato (painel do AdSense
 * > Anúncios > Por unidade de anúncio, um bloco por combinação). Enquanto a
 * chave não existir aqui, `getBannerAd` não libera aquele slot — nunca
 * chama `adsbygoogle.push()` sem um `data-ad-slot` real, o que o Google
 * rejeita e loga como erro no console sem preencher o espaço.
 */
const ADSENSE_SLOT_BY_PLACEMENT: Partial<Record<`${AdPlacement}:${AdFormat}`, string>> = {
  // 'home:banner-horizontal': '1234567890',
};

/**
 * Único ponto de decisão sobre qual provedor de anúncio é usado e se um
 * anúncio deve ser exibido. Nenhum outro módulo deve saber que provedor
 * está por trás — trocar de Google AdSense pra Ad Manager/Amazon
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

    const slotId = ADSENSE_SLOT_BY_PLACEMENT[`${placement}:${format}`];
    if (!slotId) {
      return null;
    }

    return { id: `${placement}-${format}`, placement, format, provider: 'google-ads', slotId };
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
