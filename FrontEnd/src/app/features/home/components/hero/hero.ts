import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconMovie, IconSparkles, IconTrophy } from '@tabler/icons-angular';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { CinemaDoodles } from '../../../../shared/ui/cinema-doodles/cinema-doodles';
import { Icon } from '../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Badge, Button, CinemaDoodles, Icon],
  template: `
    <section class="relative flex flex-col items-center gap-6 overflow-hidden px-6 py-24 text-center">
      <app-cinema-doodles variant="hero" />

      <app-badge>
        <app-icon [icon]="sparklesIcon" [size]="14" />
        Novo desafio todos os dias
      </app-badge>

      <h1 class="max-w-3xl text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
        Adivinhe o
        <span class="bg-gradient-to-r from-foreground to-foreground/30 bg-clip-text text-transparent">
          Filme
        </span>
      </h1>

      <p class="max-w-xl text-balance text-muted">
        Um jogo diário para cinéfilos. Descubra o filme a partir de sinopses, frames e trilhas
        sonoras. Compita no ranking e mantenha sua sequência.
      </p>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <a routerLink="/jogar">
          <app-button variant="primary" [glow]="true">
            <app-icon [icon]="movieIcon" [size]="16" />
            Jogar agora
          </app-button>
        </a>
        <a routerLink="/ranking">
          <app-button variant="secondary" [glow]="true">
            <app-icon [icon]="trophyIcon" [size]="16" />
            Ver ranking
          </app-button>
        </a>
      </div>
    </section>
  `,
})
export class Hero {
  protected readonly sparklesIcon = IconSparkles;
  protected readonly movieIcon = IconMovie;
  protected readonly trophyIcon = IconTrophy;
}
