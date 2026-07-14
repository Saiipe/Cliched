import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconMovie } from '@tabler/icons-angular';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';

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
  imports: [RouterLink, RouterLinkActive, Button, Icon],
  template: `
    <header class="sticky top-0 z-10 border-b border-border bg-bg/50 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a routerLink="/" class="flex items-center gap-2.5">
          <span class="flex size-8 items-center justify-center rounded-lg bg-surface-elevated">
            <app-icon [icon]="movieIcon" [size]="18" />
          </span>
          <span class="text-sm font-semibold text-foreground">Adivinhe o Filme</span>
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
  protected readonly movieIcon = IconMovie;
}
