import { IconDeviceGamepad2, IconMovie, IconTarget, IconUsers } from '@tabler/icons-angular';
import type { DashboardStat } from '../models/dashboard-stat.model';

export const DASHBOARD_STATS_MOCK: readonly DashboardStat[] = [
  { label: 'Jogadores', value: '12.480', icon: IconUsers },
  { label: 'Filmes no catálogo', value: '328', icon: IconMovie },
  { label: 'Partidas hoje', value: '1.874', icon: IconDeviceGamepad2 },
  { label: 'Acerto médio', value: '62%', icon: IconTarget },
];
