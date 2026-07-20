import { ChangeDetectionStrategy, Component, afterNextRender, input } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import type { AdUnit } from '../../../../features/monetization/ads/models/ad-unit.model';

@Component({
  selector: 'app-banner-vertical',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (adUnit(); as ad) {
      <ins
        class="adsbygoogle block min-h-[250px] w-40"
        [attr.data-ad-client]="clientId"
        [attr.data-ad-slot]="ad.slotId"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    }
  `,
})
export class BannerVertical {
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
