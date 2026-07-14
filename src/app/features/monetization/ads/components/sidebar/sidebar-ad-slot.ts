import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AdsService } from '../../../../../core/services/ads.service';
import { BannerVertical } from '../../../../../shared/ui/ads/banner-vertical/banner-vertical';
import { AdFormat } from '../../enums/ad-format.enum';
import type { AdPlacement } from '../../enums/ad-placement.enum';

@Component({
  selector: 'app-sidebar-ad-slot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BannerVertical],
  template: `<app-banner-vertical [adUnit]="adUnit()" />`,
})
export class SidebarAdSlot {
  readonly placement = input.required<AdPlacement>();

  private readonly adsService = inject(AdsService);

  protected readonly adUnit = computed(() =>
    this.adsService.showBanner(this.placement(), AdFormat.BannerVertical),
  );
}
