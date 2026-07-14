import { IconMovie, IconTrophy, IconUsers } from '@tabler/icons-angular';
import type { AboutHighlight } from '../models/about-highlight.model';

export const ABOUT_HIGHLIGHTS_MOCK: readonly AboutHighlight[] = [
  {
    icon: IconMovie,
    title: 'Diário',
    description: 'Um novo filme a cada dia para descobrir.',
  },
  {
    icon: IconUsers,
    title: 'Comunidade',
    description: 'Compare seu resultado com outros cinéfilos.',
  },
  {
    icon: IconTrophy,
    title: 'Ranking',
    description: 'Mantenha sua sequência e suba no ranking.',
  },
];
