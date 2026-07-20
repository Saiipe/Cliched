import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthModal } from '../../../features/auth/components/auth-modal/auth-modal';
import { ChangePasswordModal } from '../../../features/auth/components/change-password-modal/change-password-modal';
import { CookieConsentBanner } from '../../../shared/ui/cookie-consent-banner/cookie-consent-banner';
import { SparkleField } from '../../../shared/ui/cinema-doodles/sparkle-field';
import { ClarityLoaderService } from '../../services/clarity-loader.service';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';

@Component({
  selector: 'app-public-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, AuthModal, ChangePasswordModal, SparkleField, CookieConsentBanner],
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
    <app-cookie-consent-banner />
  `,
})
export class PublicShell {
  // Injetado só pra existir desde o boot da shell e reagir ao consentimento
  // assim que a pessoa decidir, sem depender de nenhuma página específica
  // chamar isso primeiro.
  private readonly clarityLoader = inject(ClarityLoaderService);
}
