import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { AdUnit } from '../../../../features/monetization/ads/models/ad-unit.model';
import { Badge } from '../../badge/badge';

/**
 * Mesmo formato visual de um card de conteúdo (ex: `GameModeCard`), pra se
 * misturar naturalmente numa grade/lista. Pensado pro catálogo, ao estilo
 * "post patrocinado" do Reddit.
 */
@Component({
  selector: 'app-native-ad-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  template: `
    @if (adUnit(); as ad) {
      <article
        class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-6 text-center"
      >
        <app-badge variant="muted">Anúncio</app-badge>
        <p class="text-sm text-muted">{{ ad.format }}</p>
      </article>
    }
  `,
})
export class NativeAdCard {
  readonly adUnit = input<AdUnit | null>(null);
}
