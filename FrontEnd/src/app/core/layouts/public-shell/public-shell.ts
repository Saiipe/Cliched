import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthModal } from '../../../features/auth/components/auth-modal/auth-modal';
import { ChangePasswordModal } from '../../../features/auth/components/change-password-modal/change-password-modal';
import { SparkleField } from '../../../shared/ui/cinema-doodles/sparkle-field';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';

@Component({
  selector: 'app-public-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, AuthModal, ChangePasswordModal, SparkleField],
  template: `
    <div class="relative">
      <app-sparkle-field />

      <div class="relative z-10">
        <app-header />

        <div class="flex min-h-[calc(100dvh-4rem)] flex-col">
          <main class="flex-1 bg-bg text-foreground">
            <router-outlet />
          </main>

          <app-footer />
        </div>
      </div>
    </div>

    <app-auth-modal />
    <app-change-password-modal />
  `,
})
export class PublicShell {}
