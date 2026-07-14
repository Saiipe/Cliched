import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameModeCard } from '../../../catalog/components/game-mode-card/game-mode-card';
import { CatalogService } from '../../../catalog/services/catalog.service';

const HIGHLIGHTED_COUNT = 4;

@Component({
  selector: 'app-game-modes-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, GameModeCard],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-16">
      <div class="flex items-end justify-between">
        <div>
          <h2 class="text-2xl font-bold text-foreground">Modos de jogo</h2>
          <p class="mt-1 text-muted">Escolha como quer testar seu repertório cinematográfico.</p>
        </div>
        <a routerLink="/jogar" class="text-sm text-foreground hover:underline">Ver todos</a>
      </div>

      <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        @for (gameMode of highlightedGameModes(); track gameMode.id) {
          <app-game-mode-card [gameMode]="gameMode" />
        }
      </div>
    </section>
  `,
})
export class GameModesSection {
  private readonly catalogService = inject(CatalogService);

  protected readonly highlightedGameModes = computed(() =>
    this.catalogService.getGameModes()().slice(0, HIGHLIGHTED_COUNT),
  );
}
