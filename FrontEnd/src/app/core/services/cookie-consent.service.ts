import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const STORAGE_KEY = 'cliched.cookie-consent';

export type ConsentChoice = 'accepted' | 'rejected';

/** LGPD/GDPR: nenhum script de métrica (Clarity) pode rodar antes da pessoa
 * decidir. `choice` começa `null` (ainda não perguntado) e só vira
 * `'accepted'`/`'rejected'` depois de uma ação explícita, persistida em
 * localStorage pra não perguntar de novo a cada visita. Scripts de
 * terceiros (ver `ClarityLoaderService`) leem este signal antes de injetar
 * qualquer tag no `<head>`. */
@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly choiceState = signal<ConsentChoice | null>(this.readStored());

  readonly choice = this.choiceState.asReadonly();

  accept(): void {
    this.setChoice('accepted');
  }

  reject(): void {
    this.setChoice('rejected');
  }

  private setChoice(choice: ConsentChoice): void {
    this.choiceState.set(choice);
    if (isPlatformBrowser(this.platformId)) {
      window.localStorage.setItem(STORAGE_KEY, choice);
    }
  }

  private readStored(): ConsentChoice | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'accepted' || stored === 'rejected' ? stored : null;
  }
}
