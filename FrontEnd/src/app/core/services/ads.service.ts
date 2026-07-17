import { Injectable, Injector, inject } from '@angular/core';
import { AdFormat } from '../../features/monetization/ads/enums/ad-format.enum';
import type { AdPlacement } from '../../features/monetization/ads/enums/ad-placement.enum';
import type { AdUnit } from '../../features/monetization/ads/models/ad-unit.model';
import type { RewardedAdResult } from '../../features/monetization/ads/models/rewarded-ad-result.model';
import { AdsService as MonetizationAdsService } from '../../features/monetization/ads/services/ads.service';

/**
 * Fachada global de anúncios. Todo o resto da aplicação (Home, Ranking,
 * Profile, features de jogo etc.) deve depender só disto e nunca importar
 * `features/monetization/ads` diretamente. Assim, qual provedor está por
 * trás e como o interstitial é montado pode mudar sem afetar quem consome.
 *
 * O Angular CDK Overlay só é importado dinamicamente dentro de
 * `showInterstitial()`. Páginas que só usam banner (a maioria) não devem
 * pagar o custo de bundle do Overlay/Portal no carregamento inicial.
 */
@Injectable({ providedIn: 'root' })
export class AdsService {
  private readonly monetizationAdsService = inject(MonetizationAdsService);
  private readonly injector = inject(Injector);

  showBanner(placement: AdPlacement, format: AdFormat = AdFormat.BannerHorizontal): AdUnit | null {
    return this.monetizationAdsService.getBannerAd(placement, format);
  }

  hideBanner(_placement: AdPlacement): void {
    // TODO: usado por provedores que exigem unmount/refresh explícito do slot.
  }

  async showInterstitial(): Promise<void> {
    await this.monetizationAdsService.requestInterstitial();

    const [{ Overlay }, { ComponentPortal }, { Interstitial }] = await Promise.all([
      import('@angular/cdk/overlay'),
      import('@angular/cdk/portal'),
      import('../../shared/ui/ads/interstitial/interstitial'),
    ]);

    const overlay = this.injector.get(Overlay);

    return new Promise<void>((resolve) => {
      const overlayRef = overlay.create({
        positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
        hasBackdrop: true,
      });

      const componentRef = overlayRef.attach(new ComponentPortal(Interstitial));
      const subscription = componentRef.instance.dismissed.subscribe(() => {
        subscription.unsubscribe();
        overlayRef.dispose();
        resolve();
      });
    });
  }

  showRewardedAd(): Promise<RewardedAdResult> {
    return this.monetizationAdsService.requestRewardedAd();
  }
}
