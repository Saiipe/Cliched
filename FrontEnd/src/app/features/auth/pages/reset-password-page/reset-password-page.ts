import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconKey, IconCircleCheck } from '@tabler/icons-angular';

import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon],
  template: `
    <section class="mx-auto flex max-w-md flex-col px-6 py-16">
      <div
        class="relative overflow-hidden rounded-3xl border border-secondary/30 bg-surface shadow-[0_0_60px_-20px_var(--secondary)]"
      >
        <div class="relative h-20 bg-gradient-to-br from-secondary via-secondary to-secondary/70">
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
          <span
            class="absolute -bottom-6 left-8 flex size-14 items-center justify-center rounded-2xl border-4 border-surface bg-surface-elevated shadow-lg"
          >
            <app-icon [icon]="success() ? checkIcon : keyIcon" [size]="24" class="text-secondary" />
          </span>
        </div>

        <div class="px-8 pb-8 pt-11">
          @if (success()) {
            <h1 class="text-2xl font-bold text-foreground">Senha redefinida!</h1>
            <p class="mt-1 text-sm text-muted">{{ successMessage() }}</p>
            <app-button class="mt-6 block" routerLink="/">Ir para o início</app-button>
          } @else if (!uid() || !token()) {
            <h1 class="text-2xl font-bold text-foreground">Link inválido</h1>
            <p class="mt-1 text-sm text-muted">
              Este link de redefinição está incompleto. Peça um novo link na tela de login.
            </p>
            <app-button class="mt-6 block" routerLink="/">Ir para o início</app-button>
          } @else {
            <h1 class="text-2xl font-bold text-foreground">Escolha uma nova senha</h1>
            <p class="mt-1 text-sm text-muted">Sua sequência de vitórias continua intacta.</p>

            <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4">
              <div>
                <label class="text-sm font-medium text-foreground" for="new">Nova senha</label>
                <input
                  id="new"
                  type="password"
                  formControlName="password"
                  autocomplete="new-password"
                  class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-base text-foreground outline-none transition focus:border-secondary sm:text-sm"
                />
                <p class="mt-1.5 text-xs text-muted">Mínimo de 7 caracteres.</p>
              </div>

              <div>
                <label class="text-sm font-medium text-foreground" for="confirm">
                  Confirmar nova senha
                </label>
                <input
                  id="confirm"
                  type="password"
                  formControlName="passwordConfirm"
                  autocomplete="new-password"
                  class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-base text-foreground outline-none transition focus:border-secondary sm:text-sm"
                />
                @if (passwordsDiverge()) {
                  <p class="mt-1.5 text-xs text-error">As senhas não conferem.</p>
                }
              </div>

              <app-button
                class="block pt-2"
                type="submit"
                [fullWidth]="true"
                [disabled]="form.invalid || passwordsDiverge() || submitting()"
              >
                {{ submitting() ? 'Salvando...' : 'Redefinir senha' }}
              </app-button>
            </form>

            @if (error()) {
              <p class="mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {{ error() }}
              </p>
            }
          }
        </div>
      </div>
    </section>
  `,
})
export class ResetPasswordPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly keyIcon = IconKey;
  protected readonly checkIcon = IconCircleCheck;
  protected readonly filmHoles = Array.from({ length: 10 });

  protected readonly uid = signal(this.route.snapshot.queryParamMap.get('uid'));
  protected readonly token = signal(this.route.snapshot.queryParamMap.get('token'));

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);
  protected readonly successMessage = signal('');

  protected readonly form = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(7)]],
    passwordConfirm: ['', Validators.required],
  });

  protected passwordsDiverge(): boolean {
    const { password, passwordConfirm } = this.form.getRawValue();
    return passwordConfirm.length > 0 && password !== passwordConfirm;
  }

  protected submit(): void {
    const uid = this.uid();
    const token = this.token();
    if (this.form.invalid || this.passwordsDiverge() || !uid || !token) {
      return;
    }

    const { password, passwordConfirm } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);

    this.authService
      .confirmPasswordReset({
        uid,
        token,
        new_password: password,
        new_password_confirm: passwordConfirm,
      })
      .subscribe({
        next: (message) => {
          this.submitting.set(false);
          this.successMessage.set(message);
          this.success.set(true);
        },
        error: (err: Error) => {
          this.submitting.set(false);
          this.error.set(err.message);
        },
      });
  }
}
