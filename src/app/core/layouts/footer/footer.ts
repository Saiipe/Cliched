import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconMessageCircle, IconMovie, IconWorld } from '@tabler/icons-angular';
import { Icon } from '../../../shared/ui/icon/icon';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <footer class="border-t border-border bg-bg text-foreground">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 md:flex-row md:items-start md:justify-between"
      >
        <div class="flex flex-col gap-3 md:max-w-xs">
          <a routerLink="/" class="flex items-center gap-2.5">
            <app-icon [icon]="movieIcon" [size]="18" />
            <span class="text-sm font-semibold text-foreground">Adivinhe o Filme</span>
          </a>
          <p class="text-sm text-muted">
            Um jogo diário para cinéfilos. Descubra filmes a partir de pistas, sinopses e frases
            marcantes.
          </p>
        </div>

        <div class="flex flex-col items-center gap-3 text-center md:items-end md:text-right">
          <h3 class="text-sm font-semibold text-foreground">Comunidade</h3>
          <div class="flex items-center gap-4">
            <a href="#" aria-label="Discord" class="text-muted hover:text-foreground">
              <app-icon [icon]="discordIcon" [size]="18" />
            </a>
            <a href="#" aria-label="Site oficial" class="text-muted hover:text-foreground">
              <app-icon [icon]="siteIcon" [size]="18" />
            </a>
          </div>
        </div>
      </div>

      <div class="border-t border-border py-6 text-center text-sm text-muted">
        © 2026 Adivinhe o Filme. Todos os direitos reservados.
      </div>
    </footer>
  `,
})
export class Footer {
  protected readonly movieIcon = IconMovie;
  protected readonly discordIcon = IconMessageCircle;
  protected readonly siteIcon = IconWorld;
}
