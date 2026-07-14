import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { AdUnit } from '../../../../features/monetization/ads/models/ad-unit.model';

/**
 * Puramente apresentacional: não sabe de placement nem de provedor, só
 * desenha o `AdUnit` que recebe (ou nada, se `adUnit` for `null`).
 */
@Component({
  selector: 'app-banner-horizontal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (adUnit(); as ad) {
      <div
        class="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-border bg-surface text-xs text-muted"
      >
        Anúncio · {{ ad.format }}
      </div>
    }
  `,
})
export class BannerHorizontal {
  readonly adUnit = input<AdUnit | null>(null);
}
