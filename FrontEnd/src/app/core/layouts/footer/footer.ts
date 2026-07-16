import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconMessageCircle, IconWorld } from '@tabler/icons-angular';
import { Icon } from '../../../shared/ui/icon/icon';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, NgOptimizedImage, RouterLink],
  template: `
    <footer class="border-t border-border bg-bg text-foreground">
      <div class="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-14 text-center sm:grid-cols-4 sm:text-left">
        <div class="col-span-2 flex flex-col items-center gap-3 sm:col-span-1 sm:items-start">
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

        <div class="flex flex-col items-center gap-3">
          <h3 class="text-sm font-semibold text-foreground">Jogo</h3>
          <div class="flex flex-col items-center gap-2">
            <a routerLink="/jogar" class="text-sm text-muted hover:text-foreground">
              Lista de jogos
            </a>
            <a routerLink="/ranking" class="text-sm text-muted hover:text-foreground">Ranking</a>
            <a routerLink="/sobre" class="text-sm text-muted hover:text-foreground">Sobre</a>
            <a routerLink="/contato" class="text-sm text-muted hover:text-foreground">Contato</a>
          </div>
        </div>

        <div class="flex flex-col items-center gap-3">
          <h3 class="text-sm font-semibold text-foreground">Legal</h3>
          <div class="flex flex-col items-center gap-2">
            <a routerLink="/privacidade" class="text-sm text-muted hover:text-foreground">
              Privacidade
            </a>
            <a routerLink="/termos" class="text-sm text-muted hover:text-foreground">Termos</a>
            <a routerLink="/cookies" class="text-sm text-muted hover:text-foreground">Cookies</a>
          </div>
        </div>

        <div class="flex flex-col items-center gap-3 sm:items-end sm:text-right">
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
