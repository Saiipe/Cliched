import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Button } from '../../../shared/ui/button/button';

interface NavLink {
  readonly label: string;
  readonly path: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { label: 'Home', path: '/' },
  { label: 'Jogar', path: '/jogar' },
  { label: 'Ranking', path: '/ranking' },
  { label: 'Sobre', path: '/sobre' },
];

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Button, NgOptimizedImage],
  template: `
    <header class="sticky top-0 z-10 border-b border-border bg-bg/50 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a routerLink="/" class="flex items-center gap-2.5">
          <img
            ngSrc="android-chrome-512x512.png"
            width="32"
            height="32"
            priority
            alt=""
            class="size-8"
          />
          <span class="text-sm font-semibold text-foreground">Cliched</span>
        </a>

        <nav aria-label="Navegação principal" class="hidden items-center gap-8 md:flex">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="text-foreground"
              [routerLinkActiveOptions]="{ exact: link.path === '/' }"
              class="text-sm text-muted transition-colors hover:text-foreground"
            >
              {{ link.label }}
            </a>
          }
        </nav>

        <div class="flex items-center gap-4">
          <a routerLink="/login" class="text-sm text-foreground">Login</a>
          <app-button variant="primary">Jogar agora</app-button>
        </div>
      </div>
    </header>
  `,
})
export class Header {
  protected readonly navLinks = NAV_LINKS;
}
