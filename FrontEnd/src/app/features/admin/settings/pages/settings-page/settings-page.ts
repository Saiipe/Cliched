import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {
  IconChevronRight,
  IconGripVertical,
  IconHome2,
  IconSettings,
  IconTrophy,
  IconX,
} from '@tabler/icons-angular';

import { Badge } from '../../../../../shared/ui/badge/badge';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import type { GameMode } from '../../../../catalog/models/game-mode.model';
import { CatalogService } from '../../../../catalog/services/catalog.service';
import { RankingSettingsService } from '../../services/ranking-settings.service';

type ModuleId = 'ranking' | 'home';

interface ModuleDef {
  readonly id: ModuleId;
  readonly title: string;
  readonly description: string;
  readonly icon: typeof IconTrophy;
}

const MODULES: readonly ModuleDef[] = [
  {
    id: 'ranking',
    title: 'Ranking',
    description: 'Comportamento do placar público.',
    icon: IconTrophy,
  },
  {
    id: 'home',
    title: 'Home',
    description: 'O que aparece na tela inicial.',
    icon: IconHome2,
  },
];

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
      <p class="mt-1 text-muted">Escolha um módulo para editar as preferências dele.</p>

      <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        @for (module of modules; track module.id) {
          <button
            type="button"
            (click)="openModule(module.id)"
            class="flex items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-left transition hover:border-secondary/40 hover:bg-surface-elevated"
          >
            <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <app-icon [icon]="module.icon" [size]="20" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-base font-semibold text-foreground">{{ module.title }}</h2>
              <p class="mt-0.5 text-sm text-muted">{{ module.description }}</p>
            </div>
            <app-icon [icon]="chevronIcon" [size]="18" class="shrink-0 text-muted" />
          </button>
        }
      </div>
    </section>

    @if (activeModule(); as moduleId) {
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
        <div class="absolute inset-0 bg-bg/80 backdrop-blur-sm" (click)="closeModule()"></div>

        <div
          class="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_0_60px_-20px_var(--secondary)]"
          [class]="moduleId === 'home' ? 'max-w-3xl' : 'max-w-xl'"
        >
          <div class="flex items-center justify-between border-b border-border px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <app-icon [icon]="moduleIconFor(moduleId)" [size]="18" />
              </div>
              <h2 class="text-base font-semibold text-foreground">{{ moduleTitleFor(moduleId) }}</h2>
            </div>
            <button
              type="button"
              aria-label="Fechar"
              class="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-elevated hover:text-foreground"
              (click)="closeModule()"
            >
              <app-icon [icon]="closeIcon" [size]="16" />
            </button>
          </div>

          <div class="overflow-y-auto px-6 py-6">
            @if (moduleId === 'ranking') {
              <div>
                <h3 class="text-sm font-semibold text-foreground">Jogadores mockados</h3>
                <p class="mt-1 text-sm text-muted">
                  Enquanto a base de jogadores reais é pequena, o ranking mistura contas
                  fictícias pra não parecer vazio. Desative quando quiser mostrar só jogadores
                  reais — reative a qualquer momento sem perder os dados.
                </p>

                <div class="mt-5 flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                  <span class="text-sm text-foreground">
                    {{ rankingSettingsService.mocksEnabled() ? 'Ativados' : 'Desativados' }}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    [attr.aria-checked]="rankingSettingsService.mocksEnabled()"
                    [disabled]="rankingSettingsService.saving()"
                    (click)="toggleMocks()"
                    class="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-60"
                    [class.bg-secondary]="rankingSettingsService.mocksEnabled()"
                    [class.bg-border]="!rankingSettingsService.mocksEnabled()"
                  >
                    <span
                      class="inline-block size-5 translate-x-1 rounded-full bg-white transition"
                      [class.translate-x-6]="rankingSettingsService.mocksEnabled()"
                    ></span>
                  </button>
                </div>
              </div>
            } @else {
              <div>
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-semibold text-foreground">Destaques da Home</h3>
                    <p class="mt-1 text-sm text-muted">
                      Arraste os modos entre as colunas para escolher os destaques e a ordem em
                      que aparecem na tela inicial.
                    </p>
                  </div>

                  <app-button [disabled]="!dirty() || saving()" (click)="save()">
                    {{ saving() ? 'Salvando...' : 'Salvar' }}
                  </app-button>
                </div>

                <div class="mt-6 grid gap-5 sm:grid-cols-2" cdkDropListGroup>
                  <div>
                    <h4 class="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                      Disponíveis
                    </h4>
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
                    <h4 class="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                      Em destaque na Home
                    </h4>
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
            }
          </div>
        </div>
      </div>
    }

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
      @if (rankingSettingsService.notice()) {
        <p
          class="pointer-events-auto rounded-xl border border-success/40 bg-surface-elevated px-4 py-3 text-sm text-success shadow-lg"
        >
          {{ rankingSettingsService.notice() }}
        </p>
      }
      @if (rankingSettingsService.error()) {
        <p
          class="pointer-events-auto rounded-xl border border-error/30 bg-surface-elevated px-4 py-3 text-sm text-error shadow-lg"
        >
          {{ rankingSettingsService.error() }}
        </p>
      }
    </div>
  `,
})
export class AdminSettingsPage {
  protected readonly catalogService = inject(CatalogService);
  protected readonly rankingSettingsService = inject(RankingSettingsService);

  protected readonly modules = MODULES;
  protected readonly activeModule = signal<ModuleId | null>(null);

  protected readonly settingsIcon = IconSettings;
  protected readonly gripIcon = IconGripVertical;
  protected readonly chevronIcon = IconChevronRight;
  protected readonly closeIcon = IconX;
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

  protected openModule(id: ModuleId): void {
    this.activeModule.set(id);
  }

  protected closeModule(): void {
    this.activeModule.set(null);
  }

  protected moduleTitleFor(id: ModuleId): string {
    return this.modules.find((module) => module.id === id)?.title ?? '';
  }

  protected moduleIconFor(id: ModuleId): typeof IconTrophy {
    return this.modules.find((module) => module.id === id)?.icon ?? IconSettings;
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
    // mutam o array in-place). Só atualiza o estado local; persistir fica
    // pro clique em "Salvar".
    this.featured.set([...this.featured()]);
    this.available.set([...this.available()]);
  }

  protected save(): void {
    this.catalogService.saveFeaturedIds(this.featured().map((mode) => mode.id));
  }

  protected toggleMocks(): void {
    this.rankingSettingsService.setMocksEnabled(!this.rankingSettingsService.mocksEnabled());
  }
}
