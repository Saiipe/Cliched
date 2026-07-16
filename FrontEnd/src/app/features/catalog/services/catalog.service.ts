import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { ApiEnvelope } from '../../daily/models/daily-session.model';
import { GAME_MODES_MOCK } from '../mocks/game-modes.mock';
import type { GameMode } from '../models/game-mode.model';

interface FeaturedGameModesResponse {
  readonly game_mode_ids: readonly string[];
}

// Sem escolha salva ainda no backend (primeiro acesso/admin nunca mexeu),
// estes são os destaques da Home — mesmo comportamento de antes de existir
// a opção de personalizar.
const DEFAULT_FEATURED_IDS: readonly string[] = ['synopsis', 'frame', 'soundtrack', 'cast'];

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  private readonly gameModes = signal<readonly GameMode[]>(GAME_MODES_MOCK);
  // Destaque é configuração global do site (todo visitante vê a mesma Home),
  // por isso vive no backend — não daria pra guardar em localStorage, que é
  // por navegador.
  private readonly featuredIds = signal<readonly string[]>(DEFAULT_FEATURED_IDS);
  private readonly savingState = signal(false);
  private readonly noticeState = signal<string | null>(null);
  private readonly errorState = signal<string | null>(null);
  private toastTimeoutId: ReturnType<typeof setTimeout> | undefined;

  readonly featuredIdsList = this.featuredIds.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly notice = this.noticeState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly featuredGameModes = computed(() => {
    const byId = new Map(this.gameModes().map((mode) => [mode.id, mode] as const));
    return this.featuredIds()
      .map((id) => byId.get(id))
      .filter((mode): mode is GameMode => mode !== undefined);
  });

  constructor() {
    this.loadFeatured();
  }

  getGameModes() {
    return this.gameModes.asReadonly();
  }

  isFeatured(id: string): boolean {
    return this.featuredIds().includes(id);
  }

  loadFeatured(): void {
    this.http
      .get<ApiEnvelope<FeaturedGameModesResponse>>(this.buildUrl('common/featured-game-modes/'))
      .subscribe({
        next: (response) => this.featuredIds.set(response.data.game_mode_ids),
        // Backend indisponível — mantém o padrão local em vez de esvaziar a Home.
        error: () => undefined,
      });
  }

  /** Substitui a lista de destaques inteira, já na ordem final, e salva no
   * backend — chamado só quando o admin clica em "Salvar" em Configurações. */
  saveFeaturedIds(ids: readonly string[]): void {
    this.savingState.set(true);
    this.errorState.set(null);
    this.noticeState.set(null);

    this.http
      .post<ApiEnvelope<FeaturedGameModesResponse>>(
        this.buildUrl('common/featured-game-modes/'),
        { game_mode_ids: ids },
      )
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (response) => {
          this.featuredIds.set(response.data.game_mode_ids);
          this.noticeState.set('Destaques da Home salvos.');
          this.scheduleToastDismissal();
        },
        error: (error: HttpErrorResponse) => {
          this.errorState.set(error.error?.message ?? 'Não foi possível salvar os destaques.');
          this.scheduleToastDismissal();
        },
      });
  }

  private scheduleToastDismissal(): void {
    if (this.toastTimeoutId !== undefined) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastTimeoutId = setTimeout(() => {
      this.noticeState.set(null);
      this.errorState.set(null);
    }, 5000);
  }

  private buildUrl(path: string): string {
    return `${environment.apiBaseUrl}/api/v1/${path}`;
  }
}
