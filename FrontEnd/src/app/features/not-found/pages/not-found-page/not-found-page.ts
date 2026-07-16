import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconHome, IconMovieOff } from '@tabler/icons-angular';

import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Badge, Button, Icon],
  template: `
    <section
      class="flex min-h-[70dvh] flex-col items-center justify-center gap-6 px-6 py-24 text-center"
    >
      <span class="flex size-16 items-center justify-center rounded-2xl bg-surface-elevated">
        <app-icon [icon]="movieOffIcon" [size]="28" class="text-primary" />
      </span>

      <p
        aria-hidden="true"
        class="select-none bg-gradient-to-r from-foreground to-foreground/20 bg-clip-text text-8xl font-extrabold leading-none tracking-tight text-transparent sm:text-9xl"
      >
        404
      </p>

      <app-badge>Erro 404</app-badge>

      <h1 class="max-w-lg text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Essa cena não existe
      </h1>

      <p class="max-w-md text-balance text-muted">
        A página que você procura foi cortada da edição final — ou o endereço está errado.
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
})
export class NotFoundPage {
  protected readonly movieOffIcon = IconMovieOff;
  protected readonly homeIcon = IconHome;
}
