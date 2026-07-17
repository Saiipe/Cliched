import { IconHeartHandshake, IconMovie, IconTrophy } from '@tabler/icons-angular';
import type { AboutHighlight } from '../models/about-highlight.model';

export const ABOUT_HIGHLIGHTS_MOCK: readonly AboutHighlight[] = [
  {
    icon: IconMovie,
    title: 'Diário',
    description: 'Um desafio novo a cada dia.',
  },
  {
    icon: IconTrophy,
    title: 'Ranking',
    description: 'Mantenha sua sequência e suba no ranking.',
  },
  {
    icon: IconHeartHandshake,
    title: 'Apoie o Jogo',
    description: 'Divulgue a plataforma para seus amigos.',
  },
];
