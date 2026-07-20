import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CookieConsentService } from '../../../core/services/cookie-consent.service';
import { Button } from '../button/button';

/** Banner de confirmação exigido antes de qualquer script de métrica rodar
 * (ver `ClarityLoaderService`, que só injeta a tag depois de `accept()`).
 * Some assim que a pessoa decide (aceitar ou recusar) e não volta a
 * aparecer nessa sessão/aparelho — a escolha fica salva em localStorage. */
@Component({
  selector: 'app-cookie-consent-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button],
  template: `
    @if (consent.choice() === null) {
      <div class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-elevated shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.3)]">
        <div class="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-5 sm:flex-row sm:justify-between">
          <p class="text-sm text-muted">
            Usamos cookies essenciais e, com sua permissão, métricas de uso e anúncios pra
            melhorar o Cliched. Veja mais na
            <a routerLink="/cookies" class="text-foreground underline hover:opacity-80">
              Política de Cookies
            </a>.
          </p>

          <div class="flex shrink-0 gap-2.5">
            <button
              type="button"
              (click)="consent.reject()"
              class="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-bg"
            >
              Recusar
            </button>
            <app-button (click)="consent.accept()">Aceitar</app-button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CookieConsentBanner {
  protected readonly consent = inject(CookieConsentService);
}
