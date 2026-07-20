import { ChangeDetectionStrategy, Component, afterNextRender, input } from '@angular/core';
import { environment } from '../../../../../environments/environment';
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
        <ins
          class="adsbygoogle block w-full"
          [attr.data-ad-client]="clientId"
          [attr.data-ad-slot]="ad.slotId"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </article>
    }
  `,
})
export class NativeAdCard {
  readonly adUnit = input<AdUnit | null>(null);
  protected readonly clientId = environment.adsenseClientId;

  constructor() {
    afterNextRender(() => {
      if (this.adUnit()) {
        (window.adsbygoogle ??= []).push({});
      }
    });
  }
}
