import { ChangeDetectionStrategy, Component, afterNextRender, input } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import type { AdUnit } from '../../../../features/monetization/ads/models/ad-unit.model';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Puramente apresentacional: não sabe de placement nem de provedor, só
 * desenha o `AdUnit` que recebe (ou nada, se `adUnit` for `null`). O
 * `adsbygoogle.push({})` só roda no browser (`afterNextRender`) — em SSR
 * não existe `window`, e o AdSense não pode ser processado no servidor.
 */
@Component({
  selector: 'app-banner-horizontal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (adUnit(); as ad) {
      <ins
        class="adsbygoogle block h-24 w-full"
        [attr.data-ad-client]="clientId"
        [attr.data-ad-slot]="ad.slotId"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    }
  `,
})
export class BannerHorizontal {
  readonly adUnit = input<AdUnit | null>(null);
  protected readonly clientId = environment.adsenseClientId;

  constructor() {
    afterNextRender(() => {
      if (this.adUnit()) {
        (window.adsbygoogle ??= []).push({});
      }
    });
  }
}
