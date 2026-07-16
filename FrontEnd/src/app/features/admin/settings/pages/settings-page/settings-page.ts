import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { IconGripVertical, IconSettings } from '@tabler/icons-angular';

import { Badge } from '../../../../../shared/ui/badge/badge';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import type { GameMode } from '../../../../catalog/models/game-mode.model';
import { CatalogService } from '../../../../catalog/services/catalog.service';

@Component({
  selector: 'app-admin-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Badge, Button, CdkDropListGroup, CdkDropList, CdkDrag],
  template: `
    <div class="border-b border-border">
      <div class="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3 text-sm text-muted">
        <app-icon [icon]="settingsIcon" [size]="16" />
        Painel administrativo · Configurações
      </div>
    </div>

    <section class="mx-auto max-w-6xl px-6 py-10">
      <h1 class="text-3xl font-bold text-foreground">Configurações</h1>
      <p class="mt-1 text-muted">Preferências gerais da plataforma.</p>

      <div class="mt-8 rounded-2xl border border-border bg-surface p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-foreground">Destaques da Home</h2>
            <p class="mt-1 text-sm text-muted">
              Arraste os modos entre as colunas para escolher os destaques e a ordem em que
              aparecem na tela inicial.
            </p>
          </div>

          <app-button [disabled]="!dirty() || saving()" (click)="save()">
            {{ saving() ? 'Salvando...' : 'Salvar' }}
          </app-button>
        </div>

        <div class="mt-6 grid gap-5 sm:grid-cols-2" cdkDropListGroup>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Disponíveis
            </h3>
            <div
              cdkDropList
              [cdkDropListData]="available()"
              (cdkDropListDropped)="onDrop($event)"
              class="mt-3 min-h-24 space-y-2 rounded-xl border border-dashed border-border p-3"
            >
              @for (gameMode of available(); track gameMode.id) {
                <div
                  cdkDrag
                  class="flex h-14 cursor-grab items-center gap-3 rounded-xl border border-border bg-bg px-3 active:cursor-grabbing"
                >
                  <app-icon [icon]="gripIcon" [size]="16" class="shrink-0 text-muted" />
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
                    <app-icon [icon]="gameMode.icon" [size]="16" />
                  </div>
                  <span class="flex-1 truncate text-sm text-foreground">{{ gameMode.title }}</span>
                  <div class="flex w-20 shrink-0 justify-end">
                    @if (gameMode.status === 'coming-soon') {
                      <app-badge variant="muted">Em breve</app-badge>
                    }
                  </div>
                </div>
              } @empty {
                <p class="px-2 py-3 text-center text-sm text-muted">Nenhum modo disponível.</p>
              }
            </div>
          </div>

          <div>
            <h3 class="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Em destaque na Home
            </h3>
            <div
              cdkDropList
              [cdkDropListData]="featured()"
              (cdkDropListDropped)="onDrop($event)"
              class="mt-3 min-h-24 space-y-2 rounded-xl border border-dashed border-secondary/40 bg-secondary/5 p-3"
            >
              @for (gameMode of featured(); track gameMode.id) {
                <div
                  cdkDrag
                  class="flex h-14 cursor-grab items-center gap-3 rounded-xl border border-border bg-bg px-3 active:cursor-grabbing"
                >
                  <app-icon [icon]="gripIcon" [size]="16" class="shrink-0 text-muted" />
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
                    <app-icon [icon]="gameMode.icon" [size]="16" />
                  </div>
                  <span class="flex-1 truncate text-sm text-foreground">{{ gameMode.title }}</span>
                  <div class="flex w-20 shrink-0 justify-end">
                    @if (gameMode.status === 'coming-soon') {
                      <app-badge variant="muted">Em breve</app-badge>
                    }
                  </div>
                </div>
              } @empty {
                <p class="px-2 py-3 text-center text-sm text-muted">
                  Arraste modos aqui para destacar na Home.
                </p>
              }
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="pointer-events-none fixed right-4 top-24 z-50 flex w-full max-w-sm flex-col gap-3">
      @if (catalogService.notice()) {
        <p
          class="pointer-events-auto rounded-xl border border-success/40 bg-surface-elevated px-4 py-3 text-sm text-success shadow-lg"
        >
          {{ catalogService.notice() }}
        </p>
      }
      @if (catalogService.error()) {
        <p
          class="pointer-events-auto rounded-xl border border-error/30 bg-surface-elevated px-4 py-3 text-sm text-error shadow-lg"
        >
          {{ catalogService.error() }}
        </p>
      }
    </div>
  `,
})
export class AdminSettingsPage {
  protected readonly catalogService = inject(CatalogService);

  protected readonly settingsIcon = IconSettings;
  protected readonly gripIcon = IconGripVertical;
  protected readonly saving = this.catalogService.saving;

  protected readonly featured = signal<GameMode[]>([]);
  protected readonly available = signal<GameMode[]>([]);

  private readonly allModes = computed(() => this.catalogService.getGameModes()());

  protected readonly dirty = computed(() => {
    const current = this.featured().map((mode) => mode.id);
    const saved = this.catalogService.featuredIdsList();
    return current.length !== saved.length || current.some((id, index) => id !== saved[index]);
  });

  constructor() {
    effect(() => {
      const featuredIds = this.catalogService.featuredIdsList();
      const byId = new Map(this.allModes().map((mode) => [mode.id, mode] as const));

      this.featured.set(
        featuredIds.map((id) => byId.get(id)).filter((mode): mode is GameMode => !!mode),
      );
      this.available.set(this.allModes().filter((mode) => !featuredIds.includes(mode.id)));
    });
  }

  protected onDrop(event: CdkDragDrop<GameMode[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    // Reatribui pra disparar os signals (moveItemInArray/transferArrayItem
    // mutam o array in-place). Só atualiza o estado local — persistir fica
    // pro clique em "Salvar".
    this.featured.set([...this.featured()]);
    this.available.set([...this.available()]);
  }

  protected save(): void {
    this.catalogService.saveFeaturedIds(this.featured().map((mode) => mode.id));
  }
}
