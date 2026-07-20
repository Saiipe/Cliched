import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IconLayoutDashboard } from '@tabler/icons-angular';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { BarChart } from '../../components/bar-chart/bar-chart';
import { LineChart } from '../../components/line-chart/line-chart';
import { StatCard } from '../../components/stat-card/stat-card';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, StatCard, LineChart, BarChart],
  template: `
    <div class="border-b border-border">
      <div class="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3 text-sm text-muted">
        <app-icon [icon]="layoutIcon" [size]="16" />
        Painel administrativo
      </div>
    </div>

    <section class="mx-auto max-w-6xl px-6 py-10">
      <h1 class="text-3xl font-bold text-foreground">Dashboard</h1>
      <p class="mt-1 text-muted">Visão geral da plataforma.</p>

      @if (dashboardService.error(); as error) {
        <p class="mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {{ error }}
        </p>
      }

      <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        @for (stat of dashboardService.stats(); track stat.label) {
          <app-stat-card [stat]="stat" />
        }
      </div>

      <div class="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article class="rounded-2xl border border-border bg-surface p-6">
          <h2 class="text-base font-semibold text-foreground">Partidas nos últimos 7 dias</h2>
          <p class="mt-1 text-sm text-muted">Total de partidas jogadas por dia.</p>
          <div class="mt-4">
            <app-line-chart
              [points]="dashboardService.matchesTrend()"
              ariaLabel="Partidas por dia na última semana"
            />
          </div>
        </article>

        <article class="rounded-2xl border border-border bg-surface p-6">
          <h2 class="text-base font-semibold text-foreground">Modos mais jogados</h2>
          <p class="mt-1 text-sm text-muted">Total de partidas por modo de jogo.</p>
          <div class="mt-6">
            <app-bar-chart [points]="dashboardService.gameModesPopularity()" />
          </div>
        </article>
      </div>
    </section>
  `,
})
export class DashboardPage {
  protected readonly dashboardService = inject(DashboardService);
  protected readonly layoutIcon = IconLayoutDashboard;
}
