import { isPlatformBrowser } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

const ANON_TOKEN_KEY = 'cliched.daily.anon_token';

@Injectable({ providedIn: 'root' })
export class AnonSessionService {
  private readonly platformId = inject(PLATFORM_ID);

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return window.localStorage.getItem(ANON_TOKEN_KEY);
  }

  storeToken(token: string | null | undefined): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (token) {
      window.localStorage.setItem(ANON_TOKEN_KEY, token);
      return;
    }

    window.localStorage.removeItem(ANON_TOKEN_KEY);
  }

  headers(): HttpHeaders | undefined {
    const token = this.getToken();
    return token ? new HttpHeaders({ 'X-Anon-Token': token }) : undefined;
  }
}