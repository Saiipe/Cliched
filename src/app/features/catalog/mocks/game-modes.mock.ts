import { IconFileText, IconPhoto, IconMusic, IconUsers } from '@tabler/icons-angular';
import type { GameMode } from '../models/game-mode.model';

export const GAME_MODES_MOCK: readonly GameMode[] = [
  {
    id: 'synopsis',
    title: 'Sinopse',
    description: 'Adivinhe o filme lendo apenas a sinopse. Um clássico para começar.',
    icon: IconFileText,
    status: 'available',
    route: '/jogar/sinopse',
  },
  {
    id: 'frame',
    title: 'Frame do Dia',
    description: 'Um único frame por dia. Você reconhece o filme na imagem?',
    icon: IconPhoto,
    status: 'coming-soon',
    route: '/jogar/frame',
  },
  {
    id: 'soundtrack',
    title: 'Trilha Sonora',
    description: 'Ouça um trecho da trilha e adivinhe o longa. Em breve.',
    icon: IconMusic,
    status: 'coming-soon',
    route: '/jogar/trilha-sonora',
  },
  {
    id: 'cast',
    title: 'Elenco',
    description: 'Descubra o filme a partir do elenco principal.',
    icon: IconUsers,
    status: 'available',
    route: '/jogar/elenco',
  },
];
