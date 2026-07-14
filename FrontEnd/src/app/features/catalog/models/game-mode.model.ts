import type { TablerIcon } from '@tabler/icons-angular';

export type GameModeStatus = 'available' | 'coming-soon';

export interface GameMode {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: TablerIcon;
  readonly status: GameModeStatus;
  readonly route: string;
}
