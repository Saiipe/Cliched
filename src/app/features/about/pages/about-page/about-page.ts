import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InfoCard } from '../../components/info-card/info-card';
import { ABOUT_HIGHLIGHTS_MOCK } from '../../mocks/about-highlights.mock';

@Component({
  selector: 'app-about-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InfoCard],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-16">
      <h1 class="text-4xl font-bold text-foreground">Sobre o jogo</h1>
      <p class="mt-3 max-w-2xl text-muted">
        Adivinhe o Filme é um jogo diário feito para fãs de cinema. Inspirado na simplicidade do
        Termo, ele traz desafios curtos, viciantes e sempre novos.
      </p>

      <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        @for (highlight of highlights; track highlight.title) {
          <app-info-card [highlight]="highlight" />
        }
      </div>
    </section>
  `,
})
export class AboutPage {
  protected readonly highlights = ABOUT_HIGHLIGHTS_MOCK;
}
