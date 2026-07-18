import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconMovie, IconX } from '@tabler/icons-angular';

import { Icon } from '../icon/icon';

export interface RevealDetail {
  readonly label: string;
  readonly value: string;
}

/** Modal de revelação do fim de jogo (acerto ou esgotou as tentativas),
 * reusado por qualquer modo de jogo. Mesmo estilo âmbar/`secondary` dos
 * outros modais da aplicação (`AuthModal`, `ChangePasswordModal`): ícone
 * circular no topo, borda e detalhes em `text-secondary`. */
@Component({
  selector: 'app-reveal-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
        <div class="absolute inset-0 bg-bg/80 backdrop-blur-sm" (click)="closed.emit()"></div>

        <div
          class="relative w-full max-w-lg rounded-3xl border border-secondary/40 bg-surface p-8 shadow-[0_0_50px_-15px_var(--secondary)]"
        >
          <button
            type="button"
            aria-label="Fechar"
            class="absolute right-5 top-5 text-muted transition hover:text-foreground"
            (click)="closed.emit()"
          >
            <app-icon [icon]="closeIcon" [size]="18" />
          </button>

          <span class="flex size-12 items-center justify-center rounded-2xl bg-surface-elevated">
            <app-icon [icon]="movieIcon" [size]="22" class="text-secondary" />
          </span>

          <p class="mt-4 text-xs uppercase tracking-[0.2em] text-secondary">Revelação</p>
          <p class="mt-1 text-sm font-medium" [class]="won() ? 'text-success' : 'text-error'">
            {{ won() ? 'Você acertou! 🎉' : 'Suas tentativas acabaram, o filme era:' }}
          </p>

          <div class="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            @if (posterUrl()) {
              <img
                [src]="posterUrl()"
                [alt]="'Pôster de ' + title()"
                class="w-32 shrink-0 rounded-xl border border-secondary/30 object-cover"
              />
            }
            <div class="min-w-0 text-center sm:text-left">
              <h2 class="text-2xl font-bold text-foreground">{{ title() }}</h2>
              @if (subtitle()) {
                <p class="mt-1 text-sm text-muted">{{ subtitle() }}</p>
              }

              @if (details().length > 0) {
                <dl class="mt-4 space-y-1.5 text-sm">
                  @for (detail of details(); track detail.label) {
                    <div class="flex justify-between gap-3 border-t border-secondary/10 pt-1.5 first:border-0 first:pt-0">
                      <dt class="text-muted">{{ detail.label }}</dt>
                      <dd class="text-right text-foreground">{{ detail.value }}</dd>
                    </div>
                  }
                </dl>
              }
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
  protected readonly closeIcon = IconX;
}
