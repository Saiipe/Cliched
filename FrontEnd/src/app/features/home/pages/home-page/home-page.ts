import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleField } from '../../../../shared/ui/cinema-doodles/sparkle-field';
import { BannerAdSlot } from '../../../monetization/ads/components/banner/banner-ad-slot';
import { AdPlacement } from '../../../monetization/ads/enums/ad-placement.enum';
import { GameModesSection } from '../../components/game-modes-section/game-modes-section';
import { Hero } from '../../components/hero/hero';
import { RankingPreview } from '../../components/ranking-preview/ranking-preview';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, BannerAdSlot, GameModesSection, RankingPreview, SparkleField],
  template: `
    <div class="relative overflow-hidden">
      <app-sparkle-field />

      <app-hero />
      <div class="mx-auto max-w-6xl px-6">
        <app-banner-ad-slot [placement]="homePlacement" />
      </div>
      <app-game-modes-section />
      <app-ranking-preview />
    </div>
  `,
})
export class HomePage {
  protected readonly homePlacement = AdPlacement.Home;
}
