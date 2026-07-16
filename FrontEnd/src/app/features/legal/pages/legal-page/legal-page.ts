import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { LEGAL_CONTENT } from '../../mocks/legal-content.mock';
import type { LegalPageType } from '../../models/legal-content.model';

@Component({
  selector: 'app-legal-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-3xl px-6 py-16">
      <h1 class="text-4xl font-bold text-foreground">{{ content().title }}</h1>
      <p class="mt-2 text-sm text-muted">Última atualização: {{ content().updatedAt }}</p>
      <p class="mt-6 text-muted">{{ content().intro }}</p>

      <div class="mt-10 space-y-8">
        @for (section of content().sections; track section.heading) {
          <div>
            <h2 class="text-lg font-semibold text-foreground">{{ section.heading }}</h2>
            <p class="mt-2 text-sm leading-relaxed text-muted">{{ section.body }}</p>
          </div>
        }
      </div>
    </section>
  `,
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);

  private readonly legalType = toSignal(
    this.route.data.pipe(map((data) => data['legalType'] as LegalPageType)),
    { requireSync: true },
  );

  protected readonly content = computed(() => LEGAL_CONTENT[this.legalType()]);
}
