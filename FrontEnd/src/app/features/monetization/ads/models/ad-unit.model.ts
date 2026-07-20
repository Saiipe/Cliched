import type { AdFormat } from '../enums/ad-format.enum';
import type { AdPlacement } from '../enums/ad-placement.enum';
import type { AdProvider } from '../types/ad-provider.type';

export interface AdUnit {
  readonly id: string;
  readonly placement: AdPlacement;
  readonly format: AdFormat;
  readonly provider: AdProvider;
  /** ID do bloco de anúncio no AdSense (painel > Anúncios > Por unidade de anúncio). */
  readonly slotId: string;
}
