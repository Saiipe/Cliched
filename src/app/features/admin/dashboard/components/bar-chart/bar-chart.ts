import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatThousands } from '../../../../../shared/utils/format-number.util';
import type { ChartPoint } from '../../models/chart-point.model';

const BAR_COLOR = '#d95926';

interface PlottedBar {
  readonly label: string;
  readonly value: number;
  readonly widthPercent: number;
}

@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      @for (bar of bars(); track bar.label) {
        <div class="group flex items-center gap-3">
          <span class="w-32 shrink-0 truncate text-sm text-muted">{{ bar.label }}</span>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-surface-elevated">
            <div
              class="h-full rounded-full transition-[filter] group-hover:brightness-125"
              [style.width.%]="bar.widthPercent"
              [style.background-color]="barColor"
            ></div>
          </div>
          <span class="w-14 shrink-0 text-right text-sm text-foreground">
            {{ formatThousands(bar.value) }}
          </span>
        </div>
      }
    </div>
  `,
})
export class BarChart {
  readonly points = input.required<readonly ChartPoint[]>();

  protected readonly barColor = BAR_COLOR;
  protected readonly formatThousands = formatThousands;

  protected readonly bars = computed<readonly PlottedBar[]>(() => {
    const data = this.points();
    const max = Math.max(...data.map((point) => point.value), 1);

    return data.map((point) => ({
      label: point.label,
      value: point.value,
      widthPercent: (point.value / max) * 100,
    }));
  });
}
