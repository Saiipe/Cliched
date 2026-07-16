import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconLogin2, IconUserPlus, IconX } from '@tabler/icons-angular';

import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';
import { AuthModalService } from '../../services/auth-modal.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon],
  template: `
    @if (authModal.isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
        <div
          class="absolute inset-0 bg-bg/80 backdrop-blur-sm"
          (click)="close()"
        ></div>

        <div class="relative w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-2xl">
          <button
            type="button"
            aria-label="Fechar"
            class="absolute right-5 top-5 text-muted transition hover:text-foreground"
            (click)="close()"
          >
            <app-icon [icon]="closeIcon" [size]="18" />
          </button>

          <span class="flex size-12 items-center justify-center rounded-2xl bg-surface-elevated">
            <app-icon
              [icon]="mode() === 'login' ? loginIcon : registerIcon"
              [size]="22"
              class="text-secondary"
            />
          </span>

          <h1 class="mt-4 text-2xl font-bold text-foreground">
            {{ mode() === 'login' ? 'Entrar' : 'Criar conta' }}
          </h1>
          <p class="mt-1 text-sm text-muted">
            {{
              mode() === 'login'
                ? 'Continue de onde parou e mantenha sua sequência.'
                : 'Salve seu progresso e acompanhe sua sequência de vitórias.'
            }}
          </p>

          @if (mode() === 'login') {
            <form [formGroup]="loginForm" (ngSubmit)="submitLogin()" class="mt-6 space-y-4">
              <div>
                <label class="text-sm font-medium text-foreground" for="identifier">
                  E-mail ou nome de usuário
                </label>
                <input
                  id="identifier"
                  type="text"
                  formControlName="identifier"
                  autocomplete="username"
                  class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-foreground" for="password">Senha</label>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                  class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary"
                />
              </div>

              <app-button
                class="block pt-2"
                type="submit"
                [fullWidth]="true"
                [disabled]="loginForm.invalid || submitting()"
              >
                {{ submitting() ? 'Entrando...' : 'Entrar' }}
              </app-button>
            </form>
          } @else {
            <form [formGroup]="registerForm" (ngSubmit)="submitRegister()" class="mt-6 space-y-4">
              <div>
                <label class="text-sm font-medium text-foreground" for="username">
                  Nome de usuário
                </label>
                <input
                  id="username"
                  type="text"
                  formControlName="username"
                  autocomplete="username"
                  class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-foreground" for="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-foreground" for="new-password">Senha</label>
                <input
                  id="new-password"
                  type="password"
                  formControlName="password"
                  autocomplete="new-password"
                  class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-foreground" for="password-confirm">
                  Confirmar senha
                </label>
                <input
                  id="password-confirm"
                  type="password"
                  formControlName="passwordConfirm"
                  autocomplete="new-password"
                  class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary"
                />
                @if (passwordsDiverge()) {
                  <p class="mt-1.5 text-xs text-error">As senhas não conferem.</p>
                }
              </div>

              <label class="flex items-start gap-2.5 pt-1 text-sm text-muted">
                <input
                  type="checkbox"
                  formControlName="acceptTerms"
                  class="mt-0.5 size-4 accent-[var(--secondary)]"
                />
                <span>
                  Li e aceito os
                  <a routerLink="/termos" (click)="close()" class="text-foreground underline hover:opacity-80">
                    termos de uso
                  </a>
                  e a
                  <a routerLink="/privacidade" (click)="close()" class="text-foreground underline hover:opacity-80">
                    política de privacidade </a
                  >.
                </span>
              </label>

              <app-button
                class="block pt-2"
                type="submit"
                [fullWidth]="true"
                [disabled]="registerForm.invalid || passwordsDiverge() || submitting()"
              >
                {{ submitting() ? 'Criando conta...' : 'Criar conta' }}
              </app-button>
            </form>
          }

          @if (error()) {
            <p class="mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
              {{ error() }}
            </p>
          }

          <p class="mt-6 text-center text-sm text-muted">
            {{ mode() === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?' }}
            <button type="button" class="font-medium text-foreground hover:underline" (click)="toggleMode()">
              {{ mode() === 'login' ? 'Cadastre-se' : 'Entrar' }}
            </button>
          </p>
        </div>
      </div>
    }
  `,
})
export class AuthModal {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  protected readonly authModal = inject(AuthModalService);

  protected readonly loginIcon = IconLogin2;
  protected readonly registerIcon = IconUserPlus;
  protected readonly closeIcon = IconX;

  protected readonly mode = this.authModal.mode;
  protected readonly submitting = this.authService.submitting;
  protected readonly error = this.authService.error;

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly registerForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirm: ['', Validators.required],
    acceptTerms: [false, Validators.requiredTrue],
  });

  constructor() {
    // Reseta os formulários e mensagens toda vez que o modal (re)abre.
    effect(() => {
      if (this.authModal.isOpen()) {
        this.loginForm.reset();
        this.registerForm.reset();
        this.authService.clearMessages();
      }
    });
  }

  protected toggleMode(): void {
    this.authModal.open(this.mode() === 'login' ? 'register' : 'login');
  }

  protected close(): void {
    this.authModal.close();
  }

  protected passwordsDiverge(): boolean {
    const { password, passwordConfirm } = this.registerForm.getRawValue();
    return passwordConfirm.length > 0 && password !== passwordConfirm;
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }
    const { identifier, password } = this.loginForm.getRawValue();
    this.authService.login(identifier.trim(), password);
  }

  protected submitRegister(): void {
    if (this.registerForm.invalid || this.passwordsDiverge()) {
      return;
    }
    const value = this.registerForm.getRawValue();
    this.authService.register({
      username: value.username.trim(),
      email: value.email.trim(),
      password: value.password,
      password_confirm: value.passwordConfirm,
      accept_terms: value.acceptTerms,
    });
  }
}
