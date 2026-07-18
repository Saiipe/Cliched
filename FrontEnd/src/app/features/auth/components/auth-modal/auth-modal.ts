import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconMailForward, IconTicket, IconUserPlus, IconX } from '@tabler/icons-angular';
import { Observable, map, of, switchMap, timer } from 'rxjs';

import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';
import { AuthModalService } from '../../services/auth-modal.service';
import { AuthService } from '../../services/auth.service';

const USERNAME_CHECK_DEBOUNCE_MS = 400;

/** Validador ajax: espera o usuário parar de digitar e pergunta pro
 * backend se o nome de usuário está disponível. De propósito não
 * verifica o formato no cliente nem explica a regra na tela (só o
 * backend sabe, e só devolve disponível/indisponível). */
function usernameAvailableValidator(authService: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = (control.value ?? '').trim();
    if (!value) {
      return of(null);
    }
    return timer(USERNAME_CHECK_DEBOUNCE_MS).pipe(
      switchMap(() => authService.checkUsernameAvailable(value)),
      map((available) => (available ? null : { unavailable: true })),
    );
  };
}

@Component({
  selector: 'app-auth-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon],
  template: `
    @if (authModal.isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
        <div class="absolute inset-0 bg-bg/80 backdrop-blur-sm" (click)="close()"></div>

        <div
          class="relative w-full max-w-md overflow-hidden rounded-3xl border border-secondary/30 bg-surface shadow-[0_0_60px_-20px_var(--secondary)]"
        >
          <!-- Faixa de identidade: gradiente + perfuração de "tira de filme" -->
          <div class="relative h-20 bg-gradient-to-br from-secondary via-secondary to-secondary/70">
            <div
              class="absolute inset-x-0 top-2 flex justify-between px-3 opacity-40"
              aria-hidden="true"
            >
              @for (hole of filmHoles; track $index) {
                <span class="size-2 rounded-[2px] bg-bg/70"></span>
              }
            </div>
            <div
              class="absolute inset-x-0 bottom-2 flex justify-between px-3 opacity-40"
              aria-hidden="true"
            >
              @for (hole of filmHoles; track $index) {
                <span class="size-2 rounded-[2px] bg-bg/70"></span>
              }
            </div>

            <button
              type="button"
              aria-label="Fechar"
              class="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-bg/20 text-white transition hover:bg-bg/35"
              (click)="close()"
            >
              <app-icon [icon]="closeIcon" [size]="16" />
            </button>

            <span
              class="absolute -bottom-6 left-8 flex size-14 items-center justify-center rounded-2xl border-4 border-surface bg-surface-elevated shadow-lg"
            >
              <app-icon [icon]="modeIcon()" [size]="24" class="text-secondary" />
            </span>
          </div>

          <div class="px-8 pb-8 pt-11">
            <h1 class="text-2xl font-bold text-foreground">{{ title() }}</h1>
            <p class="mt-1 text-sm text-muted">{{ subtitle() }}</p>

            @if (mode() === 'login') {
              <form [formGroup]="loginForm" (ngSubmit)="submitLogin()" class="mt-6 space-y-4">
                <div>
                  <label class="text-sm font-medium text-foreground" for="login-email">
                    E-mail
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-base text-foreground outline-none transition focus:border-secondary sm:text-sm"
                  />
                </div>

                <div>
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-foreground" for="password">Senha</label>
                    <button
                      type="button"
                      class="text-xs font-medium text-secondary hover:underline"
                      (click)="openForgot()"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    formControlName="password"
                    autocomplete="current-password"
                    class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-base text-foreground outline-none transition focus:border-secondary sm:text-sm"
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
            } @else if (mode() === 'register') {
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
                    class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-base text-foreground outline-none transition focus:border-secondary sm:text-sm"
                  />
                  @if (registerForm.controls.username.pending) {
                    <p class="mt-1.5 text-xs text-muted">Verificando...</p>
                  } @else if (usernameUnavailable()) {
                    <p class="mt-1 text-xs text-error">Nome de usuário indisponível.</p>
                  }
                </div>

                <div>
                  <label class="text-sm font-medium text-foreground" for="email">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-base text-foreground outline-none transition focus:border-secondary sm:text-sm"
                  />
                </div>

                <div>
                  <label class="text-sm font-medium text-foreground" for="new-password">Senha</label>
                  <input
                    id="new-password"
                    type="password"
                    formControlName="password"
                    autocomplete="new-password"
                    class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-base text-foreground outline-none transition focus:border-secondary sm:text-sm"
                  />
                  <p class="mt-1.5 text-xs text-muted">Mínimo de 7 caracteres.</p>
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
                    class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-base text-foreground outline-none transition focus:border-secondary sm:text-sm"
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
            } @else {
              <form [formGroup]="forgotForm" (ngSubmit)="submitForgot()" class="mt-6 space-y-4">
                <div>
                  <label class="text-sm font-medium text-foreground" for="forgot-email">
                    E-mail da sua conta
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-base text-foreground outline-none transition focus:border-secondary sm:text-sm"
                  />
                </div>

                <app-button
                  class="block pt-2"
                  type="submit"
                  [fullWidth]="true"
                  [disabled]="forgotForm.invalid || submitting()"
                >
                  {{ submitting() ? 'Enviando...' : 'Enviar link de redefinição' }}
                </app-button>

                <button
                  type="button"
                  class="block w-full text-center text-sm text-muted hover:text-foreground"
                  (click)="authModal.open('login')"
                >
                  Voltar para o login
                </button>
              </form>
            }

            @if (notice()) {
              <p class="mt-4 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
                {{ notice() }}
              </p>
            }
            @if (error()) {
              <p class="mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {{ error() }}
              </p>
            }

            @if (mode() !== 'forgot') {
              <p class="mt-6 text-center text-sm text-muted">
                {{ mode() === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?' }}
                <button type="button" class="font-medium text-secondary hover:underline" (click)="toggleMode()">
                  {{ mode() === 'login' ? 'Cadastre-se' : 'Entrar' }}
                </button>
              </p>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class AuthModal {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  protected readonly authModal = inject(AuthModalService);

  protected readonly closeIcon = IconX;
  protected readonly filmHoles = Array.from({ length: 10 });

  protected readonly mode = this.authModal.mode;
  protected readonly submitting = this.authService.submitting;
  protected readonly error = this.authService.error;
  protected readonly notice = this.authService.notice;

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly registerForm = this.formBuilder.nonNullable.group({
    username: [
      '',
      [Validators.required, Validators.minLength(6)],
      [usernameAvailableValidator(this.authService)],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(7)]],
    passwordConfirm: ['', Validators.required],
    acceptTerms: [false, Validators.requiredTrue],
  });

  protected readonly forgotForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    // Reseta os formulários e mensagens toda vez que o modal (re)abre.
    effect(() => {
      if (this.authModal.isOpen()) {
        this.loginForm.reset();
        this.registerForm.reset();
        this.forgotForm.reset();
        this.authService.clearMessages();
      }
    });
  }

  protected title(): string {
    switch (this.mode()) {
      case 'login':
        return 'Entrar';
      case 'register':
        return 'Criar conta';
      default:
        return 'Recuperar senha';
    }
  }

  protected subtitle(): string {
    switch (this.mode()) {
      case 'login':
        return 'Continue de onde parou e mantenha sua sequência.';
      case 'register':
        return 'Salve seu progresso e acompanhe sua sequência de vitórias.';
      default:
        return 'Informe o e-mail da conta e enviaremos um link para você escolher uma nova senha.';
    }
  }

  protected modeIcon() {
    switch (this.mode()) {
      case 'login':
        return IconTicket;
      case 'register':
        return IconUserPlus;
      default:
        return IconMailForward;
    }
  }

  protected toggleMode(): void {
    this.authModal.open(this.mode() === 'login' ? 'register' : 'login');
  }

  protected openForgot(): void {
    this.authModal.open('forgot');
  }

  protected close(): void {
    this.authModal.close();
  }

  protected passwordsDiverge(): boolean {
    const { password, passwordConfirm } = this.registerForm.getRawValue();
    return passwordConfirm.length > 0 && password !== passwordConfirm;
  }

  protected usernameUnavailable(): boolean {
    const control = this.registerForm.controls.username;
    return control.dirty && !control.pending && control.hasError('unavailable');
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }
    const { email, password } = this.loginForm.getRawValue();
    this.authService.login(email.trim(), password);
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

  protected submitForgot(): void {
    if (this.forgotForm.invalid) {
      return;
    }
    const { email } = this.forgotForm.getRawValue();
    this.authService.requestPasswordReset(email.trim());
  }
}
