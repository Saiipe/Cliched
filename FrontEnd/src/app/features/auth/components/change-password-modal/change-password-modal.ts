import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconKey, IconX } from '@tabler/icons-angular';

import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';
import { AuthService } from '../../services/auth.service';
import { ChangePasswordModalService } from '../../services/change-password-modal.service';

@Component({
  selector: 'app-change-password-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Icon],
  template: `
    @if (modal.isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
        <div class="absolute inset-0 bg-bg/80 backdrop-blur-sm" (click)="close()"></div>

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
            <app-icon [icon]="keyIcon" [size]="22" class="text-secondary" />
          </span>

          <h1 class="mt-4 text-2xl font-bold text-foreground">Alterar senha</h1>
          <p class="mt-1 text-sm text-muted">Confirme sua senha atual e escolha uma nova.</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4">
            <div>
              <label class="text-sm font-medium text-foreground" for="current">Senha atual</label>
              <input
                id="current"
                type="password"
                formControlName="current"
                autocomplete="current-password"
                class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary"
              />
            </div>

            <div>
              <label class="text-sm font-medium text-foreground" for="new">Nova senha</label>
              <input
                id="new"
                type="password"
                formControlName="next"
                autocomplete="new-password"
                class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary"
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
                formControlName="confirm"
                autocomplete="new-password"
                class="mt-1.5 w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary"
              />
              @if (passwordsDiverge()) {
                <p class="mt-1.5 text-xs text-error">As novas senhas não conferem.</p>
              }
            </div>

            <app-button
              class="block pt-2"
              type="submit"
              [fullWidth]="true"
              [disabled]="form.invalid || passwordsDiverge() || submitting()"
            >
              {{ submitting() ? 'Salvando...' : 'Alterar senha' }}
            </app-button>
          </form>

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
        </div>
      </div>
    }
  `,
})
export class ChangePasswordModal {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  protected readonly modal = inject(ChangePasswordModalService);

  protected readonly keyIcon = IconKey;
  protected readonly closeIcon = IconX;

  protected readonly submitting = this.authService.submitting;
  protected readonly error = this.authService.error;
  protected readonly notice = this.authService.notice;

  protected readonly form = this.formBuilder.nonNullable.group({
    current: ['', Validators.required],
    next: ['', [Validators.required, Validators.minLength(7)]],
    confirm: ['', Validators.required],
  });

  constructor() {
    // Reseta o formulário e as mensagens toda vez que o modal (re)abre.
    effect(() => {
      if (this.modal.isOpen()) {
        this.form.reset();
        this.authService.clearMessages();
      }
    });
  }

  protected close(): void {
    this.modal.close();
  }

  protected passwordsDiverge(): boolean {
    const { next, confirm } = this.form.getRawValue();
    return confirm.length > 0 && next !== confirm;
  }

  protected submit(): void {
    if (this.form.invalid || this.passwordsDiverge()) {
      return;
    }
    const { current, next, confirm } = this.form.getRawValue();
    this.authService.changePassword({
      current_password: current,
      new_password: next,
      new_password_confirm: confirm,
    });
    this.form.reset();
  }
}
