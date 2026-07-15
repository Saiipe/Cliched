import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconMessageCircle, IconWorld } from '@tabler/icons-angular';
import { Icon } from '../../../shared/ui/icon/icon';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, NgOptimizedImage],
  template: `
    <footer class="border-t border-border bg-bg text-foreground">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 md:flex-row md:items-start md:justify-between"
      >
        <div class="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
          <img
            ngSrc="TMDB.svg"
            width="95"
            height="41"
            alt="The Movie Database (TMDB)"
            class="h-6 w-auto"
          />
          <p class="max-w-52 text-xs text-muted">
            Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.
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
        © {{ currentYear }} Cliched. Todos os direitos reservados.
      </div>
    </footer>
  `,
})
export class Footer {
  protected readonly discordIcon = IconMessageCircle;
  protected readonly siteIcon = IconWorld;
  protected readonly currentYear = new Date().getFullYear();
}
