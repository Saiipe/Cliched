import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconConfetti, IconMovie, IconTrophy, IconX } from '@tabler/icons-angular';

import { Icon } from '../icon/icon';

export interface RevealDetail {
  readonly label: string;
  readonly value: string;
}

/** Modal de revelação do fim de jogo (acerto ou esgotou as tentativas),
 * reusado por qualquer modo de jogo. Mesma identidade visual dos outros
 * modais da aplicação (`AuthModal`): faixa gradiente com perfuração de
 * "tira de filme" no topo e emblema circular, aqui em âmbar/verde (acerto)
 * ou âmbar/neutro (esgotou tentativas) em vez do vermelho de auth, pra dar
 * uma leitura imediata de resultado antes mesmo de ler o texto. */
@Component({
  selector: 'app-reveal-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
        <div class="absolute inset-0 bg-bg/80 backdrop-blur-sm" (click)="closed.emit()"></div>

        <div
          class="relative w-full max-w-lg overflow-hidden rounded-3xl border bg-surface shadow-[0_0_60px_-20px_var(--reveal-glow)]"
          [class]="won() ? 'border-success/40' : 'border-secondary/40'"
          [style.--reveal-glow]="won() ? 'var(--success)' : 'var(--secondary)'"
        >
          <div
            class="relative h-20"
            [class]="
              won()
                ? 'bg-gradient-to-br from-success via-success to-secondary'
                : 'bg-gradient-to-br from-secondary via-secondary to-muted'
            "
          >
            <div class="absolute inset-x-0 top-2 flex justify-between px-3 opacity-40" aria-hidden="true">
              @for (hole of filmHoles; track $index) {
                <span class="size-2 rounded-[2px] bg-bg/70"></span>
              }
            </div>
            <div class="absolute inset-x-0 bottom-2 flex justify-between px-3 opacity-40" aria-hidden="true">
              @for (hole of filmHoles; track $index) {
                <span class="size-2 rounded-[2px] bg-bg/70"></span>
              }
            </div>

            <button
              type="button"
              aria-label="Fechar"
              class="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-bg/20 text-white transition hover:bg-bg/35"
              (click)="closed.emit()"
            >
              <app-icon [icon]="closeIcon" [size]="16" />
            </button>

            <span
              class="absolute -bottom-6 left-8 flex size-14 items-center justify-center rounded-2xl border-4 border-surface bg-surface-elevated shadow-lg"
            >
              <app-icon
                [icon]="won() ? trophyIcon : movieIcon"
                [size]="24"
                [class]="won() ? 'text-success' : 'text-secondary'"
              />
            </span>
          </div>

          <div class="px-8 pb-8 pt-11">
            <p
              class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
              [class]="won() ? 'text-success' : 'text-secondary'"
            >
              @if (won()) {
                <app-icon [icon]="confettiIcon" [size]="14" />
              }
              Revelação
            </p>
            <p class="mt-1 text-sm font-medium" [class]="won() ? 'text-success' : 'text-error'">
              {{ won() ? 'Você acertou! 🎉' : 'Suas tentativas acabaram, o filme era:' }}
            </p>

            <div class="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              @if (posterUrl()) {
                <img
                  [src]="posterUrl()"
                  [alt]="'Pôster de ' + title()"
                  class="w-32 shrink-0 rounded-xl border object-cover"
                  [class]="won() ? 'border-success/30' : 'border-secondary/30'"
                />
              }
              <div class="min-w-0 flex-1 text-center sm:text-left">
                <h2 class="break-words text-2xl font-bold text-foreground">{{ title() }}</h2>
                @if (subtitle()) {
                  <p class="mt-1 break-words text-sm text-muted">{{ subtitle() }}</p>
                }

                @if (details().length > 0) {
                  <dl class="mt-4 space-y-1.5 text-sm">
                    @for (detail of details(); track detail.label) {
                      <div
                        class="flex justify-between gap-3 border-t pt-1.5 first:border-0 first:pt-0"
                        [class]="won() ? 'border-success/10' : 'border-secondary/10'"
                      >
                        <dt class="shrink-0 text-muted">{{ detail.label }}</dt>
                        <dd class="min-w-0 break-words text-right text-foreground">{{ detail.value }}</dd>
                      </div>
                    }
                  </dl>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class RevealModal {
  readonly open = input.required<boolean>();
  readonly won = input.required<boolean>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly posterUrl = input<string>('');
  readonly details = input<readonly RevealDetail[]>([]);

  readonly closed = output<void>();

  protected readonly movieIcon = IconMovie;
  protected readonly trophyIcon = IconTrophy;
  protected readonly confettiIcon = IconConfetti;
  protected readonly closeIcon = IconX;
  protected readonly filmHoles = Array.from({ length: 10 });
}
