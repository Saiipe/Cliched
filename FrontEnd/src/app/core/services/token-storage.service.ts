import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

const ACCESS_KEY = 'cliched.auth.access';
const REFRESH_KEY = 'cliched.auth.refresh';

/** Guarda do par de tokens JWT. Separado do AuthService de propósito: o
 * interceptor HTTP depende só daqui (sem HttpClient), evitando dependência
 * circular interceptor → AuthService → HttpClient → interceptor. */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  access(): string | null {
    return this.read(ACCESS_KEY);
  }

  refresh(): string | null {
    return this.read(REFRESH_KEY);
  }

  store(tokens: { access: string; refresh?: string }): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.localStorage.setItem(ACCESS_KEY, tokens.access);
    if (tokens.refresh) {
      window.localStorage.setItem(REFRESH_KEY, tokens.refresh);
    }
  }

  clear(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  }

  private read(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return window.localStorage.getItem(key);
  }
}
