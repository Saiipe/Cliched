import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Sparkle {
  readonly top: string;
  readonly left: string;
  readonly size: string;
  /** 'amber' = destaque (secondary), 'white' = neutro (foreground). */
  readonly tone: 'amber' | 'white';
  readonly delay: string;
}

/** Posições fixas (não aleatórias) para o SSR e o cliente renderizarem o
 * mesmo campo: aleatoriedade em runtime quebraria a hidratação. */
const SPARKLES: readonly Sparkle[] = [
  { top: '4%', left: '22%', size: '1.25rem', tone: 'amber', delay: '0s' },
  { top: '8%', left: '72%', size: '0.9rem', tone: 'white', delay: '1.2s' },
  { top: '15%', left: '10%', size: '0.9rem', tone: 'white', delay: '0.6s' },
  { top: '19%', left: '88%', size: '1.1rem', tone: 'amber', delay: '2s' },
  { top: '30%', left: '45%', size: '0.8rem', tone: 'white', delay: '1.6s' },
  { top: '36%', left: '6%', size: '1.1rem', tone: 'amber', delay: '0.3s' },
  { top: '43%', left: '93%', size: '0.9rem', tone: 'white', delay: '2.4s' },
  { top: '55%', left: '18%', size: '0.9rem', tone: 'amber', delay: '1s' },
  { top: '60%', left: '80%', size: '1.2rem', tone: 'white', delay: '0.8s' },
  { top: '71%', left: '8%', size: '0.8rem', tone: 'white', delay: '2.2s' },
  { top: '76%', left: '60%', size: '1rem', tone: 'amber', delay: '1.4s' },
  { top: '85%', left: '30%', size: '0.9rem', tone: 'white', delay: '0.4s' },
  { top: '90%', left: '86%', size: '1.1rem', tone: 'amber', delay: '1.8s' },
];

/** Estrelinhas (brancas e âmbar) pulsando, espalhadas por todo o container.
 * Decoração pura: o pai precisa ser `relative`. */
@Component({
  selector: 'app-sparkle-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pointer-events-none absolute inset-0 block',
    'aria-hidden': 'true',
  },
  template: `
    @for (sparkle of sparkles; track $index) {
      <svg
        class="sparkle absolute"
        [class]="sparkle.tone === 'amber' ? 'text-secondary/60' : 'text-foreground/40'"
        [style.top]="sparkle.top"
        [style.left]="sparkle.left"
        [style.width]="sparkle.size"
        [style.animation-delay]="sparkle.delay"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <path d="M12 3 V21 M3 12 H21" />
      </svg>
    }
  `,
  styles: `
    @keyframes sparkle-pulse {
      from {
        opacity: 0.2;
        scale: 0.75;
      }
      to {
        opacity: 1;
        scale: 1.1;
      }
    }

    .sparkle {
      animation: sparkle-pulse 2.6s ease-in-out infinite alternate;
    }

    @media (prefers-reduced-motion: reduce) {
      .sparkle {
        animation: none;
      }
    }
  `,
})
export class SparkleField {
  protected readonly sparkles = SPARKLES;
}
