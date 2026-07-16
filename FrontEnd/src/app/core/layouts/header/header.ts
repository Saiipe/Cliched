import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconChevronDown, IconFlame, IconKey, IconLogout } from '@tabler/icons-angular';

import { AuthModalService } from '../../../features/auth/services/auth-modal.service';
import { AuthService } from '../../../features/auth/services/auth.service';
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
  imports: [RouterLink, RouterLinkActive, Button, Icon, NgOptimizedImage],
  template: `
    <header class="sticky top-0 z-10 border-b border-border bg-bg/50 backdrop-blur-md">
      <div
        class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:justify-normal"
      >
        <a routerLink="/" class="flex items-center gap-2.5 justify-self-start">
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

        <nav aria-label="Navegação principal" class="hidden items-center gap-8 justify-self-center md:flex">
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

        <div class="flex items-center gap-4 justify-self-end">
          @if (user(); as currentUser) {
            @if (stats(); as currentStats) {
              <span
                class="hidden items-center gap-1 text-sm text-muted sm:flex"
                title="Sequência de vitórias no desafio diário"
              >
                <app-icon [icon]="flameIcon" [size]="16" class="text-secondary" />
                {{ currentStats.current_streak }}
              </span>
            }

            <div class="relative">
              <button
                type="button"
                class="flex items-center gap-1.5 text-sm text-foreground"
                (click)="toggleMenu()"
              >
                {{ currentUser.username }}
                <app-icon
                  [icon]="chevronIcon"
                  [size]="14"
                  class="text-muted transition-transform"
                  [class.rotate-180]="menuOpen()"
                />
              </button>

              @if (menuOpen()) {
                <div
                  class="absolute right-0 top-full mt-3 w-48 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-lg"
                >
                  <a
                    routerLink="/alterar-senha"
                    class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition hover:bg-bg"
                    (click)="closeMenu()"
                  >
                    <app-icon [icon]="keyIcon" [size]="16" class="text-muted" />
                    Alterar senha
                  </a>
                  <button
                    type="button"
                    class="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition hover:bg-bg"
                    (click)="logout()"
                  >
                    <app-icon [icon]="logoutIcon" [size]="16" class="text-muted" />
                    Sair
                  </button>
                </div>
              }
            </div>
          } @else {
            <button type="button" class="text-sm text-foreground" (click)="authModal.open('login')">
              Login
            </button>
            <app-button variant="primary" (click)="authModal.open('register')">
              Cadastre-se
            </app-button>
          }
        </div>
      </div>
    </header>
  `,
})
export class Header {
  private readonly authService = inject(AuthService);
  protected readonly authModal = inject(AuthModalService);

  protected readonly navLinks = NAV_LINKS;
  protected readonly flameIcon = IconFlame;
  protected readonly chevronIcon = IconChevronDown;
  protected readonly keyIcon = IconKey;
  protected readonly logoutIcon = IconLogout;

  protected readonly user = this.authService.user;
  protected readonly stats = this.authService.stats;
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.closeMenu();
    this.authService.logout();
  }
}
