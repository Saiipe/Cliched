import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconHome } from '@tabler/icons-angular';

import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { CinemaDoodles } from '../../../../shared/ui/cinema-doodles/cinema-doodles';
import { Icon } from '../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Badge, Button, CinemaDoodles, Icon],
  template: `
    <section
      class="relative flex min-h-[70dvh] flex-col items-center justify-center gap-6 overflow-hidden px-6 py-24 text-center"
    >
      <app-cinema-doodles variant="not-found" />

      <!-- 404 com o rolo de filme no lugar do zero -->
      <div aria-hidden="true" class="relative flex select-none items-center gap-2 sm:gap-4">
        <span
          class="bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-8xl font-extrabold leading-none tracking-tight text-transparent sm:text-9xl"
        >
          4
        </span>
        <svg
          class="reel-spin w-24 text-secondary sm:w-32"
          viewBox="0 0 120 120"
          fill="none"
          stroke="currentColor"
          stroke-width="5"
        >
          <circle cx="60" cy="60" r="53" />
          <circle cx="60" cy="60" r="11" />
          <circle cx="60" cy="27" r="12" />
          <circle cx="60" cy="93" r="12" />
          <circle cx="27" cy="60" r="12" />
          <circle cx="93" cy="60" r="12" />
        </svg>
        <span
          class="bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-8xl font-extrabold leading-none tracking-tight text-transparent sm:text-9xl"
        >
          4
        </span>
      </div>

      <app-badge>Erro 404 · fim do rolo</app-badge>

      <h1 class="max-w-lg text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Essa cena não existe
      </h1>

      <p class="max-w-md text-balance text-muted">
        A página que você procura foi cortada da edição final, ou o endereço está errado.
        Que tal voltar para o início e escolher um desafio?
      </p>

      <a routerLink="/">
        <app-button variant="primary" [glow]="true">
          <app-icon [icon]="homeIcon" [size]="16" />
          Voltar para o início
        </app-button>
      </a>
    </section>
  `,
  styles: `
    @keyframes reel-spin {
      to {
        transform: rotate(360deg);
      }
    }

    .reel-spin {
      animation: reel-spin 24s linear infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .reel-spin {
        animation: none;
      }
    }
  `,
})
export class NotFoundPage {
  protected readonly homeIcon = IconHome;
}
