import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { AdUnit } from '../../../../features/monetization/ads/models/ad-unit.model';

@Component({
  selector: 'app-banner-vertical',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (adUnit(); as ad) {
      <div
        class="flex min-h-[250px] w-40 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface text-center text-xs text-muted"
      >
        Anúncio · {{ ad.format }}
      </div>
    }
  `,
})
export class BannerVertical {
  readonly adUnit = input<AdUnit | null>(null);
}
