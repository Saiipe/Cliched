import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AdsService } from '../../../../../core/services/ads.service';
import { NativeAdCard } from '../../../../../shared/ui/ads/native-card/native-card';
import { AdFormat } from '../../enums/ad-format.enum';
import type { AdPlacement } from '../../enums/ad-placement.enum';

/**
 * Banner discreto, pensado pro Perfil: usa o formato nativo (cartão),
 * que ocupa menos espaço e não compete visualmente com o conteúdo.
 */
@Component({
  selector: 'app-footer-ad-slot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NativeAdCard],
  template: `<app-native-ad-card [adUnit]="adUnit()" />`,
})
export class FooterAdSlot {
  readonly placement = input.required<AdPlacement>();

  private readonly adsService = inject(AdsService);

  protected readonly adUnit = computed(() =>
    this.adsService.showBanner(this.placement(), AdFormat.Native),
  );
}
