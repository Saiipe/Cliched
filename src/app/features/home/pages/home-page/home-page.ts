import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameModesSection } from '../../components/game-modes-section/game-modes-section';
import { Hero } from '../../components/hero/hero';
import { RankingPreview } from '../../components/ranking-preview/ranking-preview';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, GameModesSection, RankingPreview],
  template: `
    <app-hero />
    <app-game-modes-section />
    <app-ranking-preview />
  `,
})
export class HomePage {}
