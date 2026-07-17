import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { IconChevronDown, IconTrophy, IconUsers } from '@tabler/icons-angular';

import { Badge } from '../../../../../shared/ui/badge/badge';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { AdminUserService } from '../../services/admin-user.service';

@Component({
  selector: 'app-admin-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Badge],
  template: `
    <div class="border-b border-border">
      <div class="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3 text-sm text-muted">
        <app-icon [icon]="usersIcon" [size]="16" />
        Painel administrativo · Usuários
      </div>
    </div>

    <section class="mx-auto max-w-6xl px-6 py-10">
      <h1 class="text-3xl font-bold text-foreground">Usuários</h1>
      <p class="mt-1 text-muted">
        Último acesso, histórico de login e posição por total de vitórias no desafio diário.
      </p>

      @if (service.loading()) {
        <p class="mt-8 text-sm text-muted">Carregando usuários...</p>
      } @else if (service.error()) {
        <p class="mt-8 text-sm text-error">{{ service.error() }}</p>
      } @else {
        <div class="mt-8 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead class="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th class="px-4 py-3 font-medium">Usuário</th>
                <th class="px-4 py-3 font-medium">E-mail</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Criada em</th>
                <th class="px-4 py-3 font-medium">Último acesso</th>
                <th class="px-4 py-3 font-medium">
                  <span class="inline-flex items-center gap-1">
                    <app-icon [icon]="trophyIcon" [size]="14" />
                    Posição
                  </span>
                </th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              @for (user of service.users(); track user.id) {
                <tr class="border-b border-border last:border-0">
                  <td class="px-4 py-3 font-medium text-foreground">{{ user.username }}</td>
                  <td class="px-4 py-3 text-muted">{{ user.email || '—' }}</td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1.5">
                      @if (user.is_superuser) {
                        <app-badge variant="outline">Admin</app-badge>
                      }
                      @if (user.is_premium) {
                        <app-badge variant="outline">Premium</app-badge>
                      }
                      @if (!user.is_active) {
                        <app-badge variant="muted">Inativo</app-badge>
                      }
                    </div>
                  </td>
                  <td class="px-4 py-3 text-muted">{{ formatDate(user.date_joined) }}</td>
                  <td class="px-4 py-3 text-muted">
                    {{ user.last_login ? formatDate(user.last_login) : 'Nunca acessou' }}
                  </td>
                  <td class="px-4 py-3 text-muted">
                    #{{ user.rank_position }} · {{ user.total_wins }}
                    {{ user.total_wins === 1 ? 'vitória' : 'vitórias' }}
                  </td>
                  <td class="px-4 py-3">
                    <button
                      type="button"
                      class="flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
                      (click)="toggleHistory(user.id)"
                    >
                      Histórico de acesso
                      <app-icon
                        [icon]="chevronIcon"
                        [size]="14"
                        class="transition-transform"
                        [class.rotate-180]="service.loginHistoryUserId() === user.id"
                      />
                    </button>
                  </td>
                </tr>
                @if (service.loginHistoryUserId() === user.id) {
                  <tr class="border-b border-border bg-bg/50 last:border-0">
                    <td colspan="7" class="px-4 py-3">
                      @if (service.loginHistoryLoading()) {
                        <p class="text-xs text-muted">Carregando histórico...</p>
                      } @else if (service.loginHistory().length === 0) {
                        <p class="text-xs text-muted">Nenhum login registrado.</p>
                      } @else {
                        <ul class="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                          @for (login of service.loginHistory(); track login.created_at) {
                            <li>
                              {{ formatDate(login.created_at) }}
                              @if (login.ip_address) {
                                <span class="text-muted/70">({{ login.ip_address }})</span>
                              }
                            </li>
                          }
                        </ul>
                      }
                    </td>
                  </tr>
                }
              } @empty {
                <tr>
                  <td colspan="7" class="px-4 py-6 text-center text-muted">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class AdminUsersPage implements OnInit {
  protected readonly service = inject(AdminUserService);

  protected readonly usersIcon = IconUsers;
  protected readonly trophyIcon = IconTrophy;
  protected readonly chevronIcon = IconChevronDown;

  ngOnInit(): void {
    this.service.loadUsers();
  }

  protected toggleHistory(userId: number): void {
    this.service.toggleLoginHistory(userId);
  }

  protected formatDate(value: string): string {
    return new Date(value).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }
}
