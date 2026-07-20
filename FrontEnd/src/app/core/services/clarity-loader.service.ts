import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject } from '@angular/core';

import { CookieConsentService } from './cookie-consent.service';

const CLARITY_PROJECT_ID = 'xpm92rntk1';

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}

/** Injeta o script do Microsoft Clarity só depois que a pessoa aceita
 * cookies/métricas (ver `CookieConsentService`) — nunca no carregamento
 * inicial da página, senão a métrica roda antes do consentimento e a
 * confirmação vira só decoração. SSR-safe: `window`/`document` só existem
 * no browser, então isso não roda durante o render no servidor. */
@Injectable({ providedIn: 'root' })
export class ClarityLoaderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly consent = inject(CookieConsentService);

  private loaded = false;

  constructor() {
    effect(() => {
      if (this.consent.choice() === 'accepted') {
        this.load();
      }
    });
  }

  private load(): void {
    if (this.loaded || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loaded = true;

    window.clarity = window.clarity || function (...args: unknown[]) {
      (window.clarity!.q = window.clarity!.q || []).push(args);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
    document.head.appendChild(script);
  }
}
