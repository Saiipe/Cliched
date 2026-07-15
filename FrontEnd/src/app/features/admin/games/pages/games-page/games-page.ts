import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IconDeviceGamepad2 } from '@tabler/icons-angular';

import { Icon } from '../../../../../shared/ui/icon/icon';
import { CatalogService } from '../../../../catalog/services/catalog.service';
import { AdminGameModeCard } from '../../components/admin-game-mode-card/admin-game-mode-card';

@Component({
  selector: 'app-admin-games-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, AdminGameModeCard],
  template: `
    <div class="border-b border-border">
      <div class="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3 text-sm text-muted">
        <app-icon [icon]="gamepadIcon" [size]="16" />
        Painel administrativo · Jogos
      </div>
    </div>

    <section class="mx-auto max-w-6xl px-6 py-10">
      <h1 class="text-3xl font-bold text-foreground">Jogos</h1>
      <p class="mt-1 text-muted">
        Todos os modos da plataforma. Clique em um card para ver as opções administrativas.
      </p>

      <div class="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        @for (gameMode of catalogService.getGameModes()(); track gameMode.id) {
          <app-admin-game-mode-card [gameMode]="gameMode" />
        }
      </div>
    </section>
  `,
})
export class AdminGamesPage {
  protected readonly catalogService = inject(CatalogService);
  protected readonly gamepadIcon = IconDeviceGamepad2;
}
