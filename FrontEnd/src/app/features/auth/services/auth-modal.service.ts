import { Injectable, signal } from '@angular/core';

export type AuthModalMode = 'login' | 'register' | 'forgot';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  private readonly openState = signal(false);
  private readonly modeState = signal<AuthModalMode>('login');

  readonly isOpen = this.openState.asReadonly();
  readonly mode = this.modeState.asReadonly();

  open(mode: AuthModalMode = 'login'): void {
    this.modeState.set(mode);
    this.openState.set(true);
  }

  close(): void {
    this.openState.set(false);
  }
}
