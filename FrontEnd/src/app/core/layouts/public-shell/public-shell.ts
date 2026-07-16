import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthModal } from '../../../features/auth/components/auth-modal/auth-modal';
import { SparkleField } from '../../../shared/ui/cinema-doodles/sparkle-field';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';

@Component({
  selector: 'app-public-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, AuthModal, SparkleField],
  template: `
    <div class="relative">
      <app-sparkle-field />

      <app-header />

      <div class="flex min-h-[calc(100dvh-4rem)] flex-col">
        <main class="flex-1 bg-bg text-foreground">
          <router-outlet />
        </main>

        <app-footer />
      </div>
    </div>

    <app-auth-modal />
  `,
})
export class PublicShell {}
