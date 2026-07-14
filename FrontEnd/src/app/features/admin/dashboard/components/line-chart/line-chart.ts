import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ChartPoint } from '../../models/chart-point.model';

const WIDTH = 560;
const HEIGHT = 200;
const PADDING_X = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;
const LINE_COLOR = '#3987e5';

interface PlottedPoint {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly value: number;
}

@Component({
  selector: 'app-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + width + ' ' + height"
      class="w-full"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      @for (y of gridLines(); track y) {
        <line
          [attr.x1]="paddingX"
          [attr.x2]="width - paddingX"
          [attr.y1]="y"
          [attr.y2]="y"
          stroke="var(--border)"
          stroke-width="1"
        />
      }

      <path [attr.d]="areaPath()" [attr.fill]="lineColor" fill-opacity="0.12" stroke="none" />
      <path
        [attr.d]="linePath()"
        fill="none"
        [attr.stroke]="lineColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      @for (point of points(); track point.label) {
        <g class="group">
          <circle
            [attr.cx]="point.x"
            [attr.cy]="point.y"
            r="8"
            fill="transparent"
            class="cursor-pointer"
          >
            <title>{{ point.label }}: {{ point.value }} partidas</title>
          </circle>
          <circle
            [attr.cx]="point.x"
            [attr.cy]="point.y"
            r="3"
            [attr.fill]="lineColor"
            class="pointer-events-none transition-[r] group-hover:[r:5]"
          />
          <text
            [attr.x]="point.x"
            [attr.y]="height - 6"
            text-anchor="middle"
            class="fill-muted text-[10px]"
          >
            {{ point.label }}
          </text>
        </g>
      }
    </svg>
  `,
})
export class LineChart {
  readonly points_ = input.required<readonly ChartPoint[]>({ alias: 'points' });
  readonly ariaLabel = input<string>('Gráfico de linha');

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly paddingX = PADDING_X;
  protected readonly lineColor = LINE_COLOR;

  private readonly maxValue = computed(() =>
    Math.max(...this.points_().map((point) => point.value), 1),
  );

  protected readonly points = computed<readonly PlottedPoint[]>(() => {
    const data = this.points_();
    const max = this.maxValue();
    const plotWidth = WIDTH - PADDING_X * 2;
    const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    return data.map((point, index) => {
      const x = PADDING_X + (data.length === 1 ? 0 : (index / (data.length - 1)) * plotWidth);
      const y = PADDING_TOP + plotHeight - (point.value / max) * plotHeight;
      return { x, y, label: point.label, value: point.value };
    });
  });

  protected readonly gridLines = computed(() => {
    const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    return [0, 0.25, 0.5, 0.75, 1].map((fraction) => PADDING_TOP + plotHeight * fraction);
  });

  protected readonly linePath = computed(() =>
    this.points()
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
      .join(' '),
  );

  protected readonly areaPath = computed(() => {
    const plotted = this.points();
    if (plotted.length === 0) {
      return '';
    }

    const baseline = HEIGHT - PADDING_BOTTOM;
    const line = plotted.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`);
    const lastPoint = plotted[plotted.length - 1];
    const firstPoint = plotted[0];

    return [...line, `L${lastPoint.x},${baseline}`, `L${firstPoint.x},${baseline}`, 'Z'].join(' ');
  });
}
