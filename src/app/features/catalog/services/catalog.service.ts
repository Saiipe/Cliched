import { Injectable, signal } from '@angular/core';
import { GAME_MODES_MOCK } from '../mocks/game-modes.mock';
import type { GameMode } from '../models/game-mode.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly gameModes = signal<readonly GameMode[]>(GAME_MODES_MOCK);

  getGameModes() {
    return this.gameModes.asReadonly();
  }
}
