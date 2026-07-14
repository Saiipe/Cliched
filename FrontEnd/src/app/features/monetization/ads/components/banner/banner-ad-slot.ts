import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AdsService } from '../../../../../core/services/ads.service';
import { BannerHorizontal } from '../../../../../shared/ui/ads/banner-horizontal/banner-horizontal';
import { AdFormat } from '../../enums/ad-format.enum';
import type { AdPlacement } from '../../enums/ad-placement.enum';

/**
 * O que as páginas realmente usam para exibir um banner horizontal — sabe
 * qual `placement` está pedindo e busca o `AdUnit` correspondente; a
 * apresentação em si é toda do `BannerHorizontal` (shared/ui, sem lógica).
 */
@Component({
  selector: 'app-banner-ad-slot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BannerHorizontal],
  template: `<app-banner-horizontal [adUnit]="adUnit()" />`,
})
export class BannerAdSlot {
  readonly placement = input.required<AdPlacement>();

  private readonly adsService = inject(AdsService);

  protected readonly adUnit = computed(() =>
    this.adsService.showBanner(this.placement(), AdFormat.BannerHorizontal),
  );
}
