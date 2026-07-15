import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameModeCard } from '../../components/game-mode-card/game-mode-card';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameModeCard],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-16">
      <h1 class="text-4xl font-bold text-foreground">Escolha um modo</h1>
      <p class="mt-3 text-muted">
        O desafio diário já conversa com o backend; os demais modos ainda estão em construção.
      </p>

      <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        @for (gameMode of catalogService.getGameModes()(); track gameMode.id) {
          <app-game-mode-card [gameMode]="gameMode" />
        }
      </div>
    </section>
  `,
})
export class CatalogPage {
  protected readonly catalogService = inject(CatalogService);
}
