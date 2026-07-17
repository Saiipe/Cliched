import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconLogout, IconMovie } from '@tabler/icons-angular';
import { AuthService } from '../../../auth/services/auth.service';
import { Icon } from '../../../../shared/ui/icon/icon';

interface AdminNavLink {
  readonly label: string;
  readonly path: string | null;
}

const NAV_LINKS: readonly AdminNavLink[] = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Jogos', path: '/admin/jogos' },
  { label: 'Filmes', path: null },
  { label: 'Sinopses', path: null },
  { label: 'Usuários', path: null },
  { label: 'Configurações', path: '/admin/configuracoes' },
];

/**
 * Navbar exclusiva do painel administrativo — de propósito não reaproveita o
 * `Header` público (branding, links e CTA são completamente diferentes).
 * Links sem rota ainda (`path: null`) aparecem desabilitados, não escondidos —
 * comunica a estrutura prevista sem simular navegação que não existe.
 */
@Component({
  selector: 'app-admin-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <header class="sticky top-0 z-10 border-b border-border bg-surface">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div class="flex items-center gap-2.5">
          <span class="flex size-8 items-center justify-center rounded-lg bg-surface-elevated">
            <app-icon [icon]="movieIcon" [size]="18" />
          </span>
          <span class="text-sm font-semibold text-foreground">Studio</span>
        </div>

        <nav aria-label="Navegação administrativa" class="hidden items-center gap-8 md:flex">
          @for (link of navLinks; track link.label) {
            @if (link.path) {
              <a
                [routerLink]="link.path"
                routerLinkActive="text-foreground"
                [routerLinkActiveOptions]="{ exact: true }"
                class="text-sm text-muted transition-colors hover:text-foreground"
              >
                {{ link.label }}
              </a>
            } @else {
              <span class="text-sm text-muted/50" aria-disabled="true">{{ link.label }}</span>
            }
          }
        </nav>

        <div class="flex items-center gap-4">
          @if (user(); as currentUser) {
            <span class="text-sm text-muted">
              Logado como <span class="text-foreground">{{ currentUser.username }}</span>
            </span>
          }
          <button
            type="button"
            class="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            (click)="logout()"
          >
            <app-icon [icon]="logoutIcon" [size]="16" />
            Sair
          </button>
        </div>
      </div>
    </header>
  `,
})
export class AdminHeader {
  private readonly authService = inject(AuthService);

  protected readonly navLinks = NAV_LINKS;
  protected readonly movieIcon = IconMovie;
  protected readonly logoutIcon = IconLogout;
  protected readonly user = this.authService.user;

  protected logout(): void {
    this.authService.logout();
  }
}
