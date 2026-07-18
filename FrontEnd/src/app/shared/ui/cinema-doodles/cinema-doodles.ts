import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CinemaDoodlesVariant = 'not-found' | 'hero';

/**
 * Ilustrações line-art de cinema (película, claquete, ingresso, pipoca,
 * câmera) para preencher o fundo de seções-herói. As estrelas vivem à parte,
 * em `SparkleField` (montado globalmente no shell). Puramente decorativo:
 * aria-hidden, sem eventos de ponteiro, e as animações respeitam
 * prefers-reduced-motion. O pai precisa ser `relative` (e idealmente
 * `overflow-hidden`).
 */
@Component({
  selector: 'app-cinema-doodles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pointer-events-none absolute inset-0 block',
    'aria-hidden': 'true',
  },
  template: `
    <!-- Tira de película: só na 404, atrás dos dígitos gigantes -->
    @if (variant() === 'not-found') {
      <svg
        class="absolute left-1/2 top-1/2 w-[130%] max-w-none -translate-x-1/2 -translate-y-[145%] -rotate-6 text-border"
        viewBox="0 0 900 64"
        fill="none"
        stroke="currentColor"
        preserveAspectRatio="none"
      >
        <path d="M0 6 H900" stroke-width="3" />
        <path d="M0 58 H900" stroke-width="3" />
        <path d="M6 16 H900" stroke-width="8" stroke-dasharray="10 16" />
        <path d="M6 48 H900" stroke-width="8" stroke-dasharray="10 16" />
        <path d="M0 32 H900" stroke-width="2" stroke-dasharray="42 10" class="text-surface-elevated" />
      </svg>
    }

    <!-- Claquete -->
    <svg
      class="illustration-float absolute left-[8%] top-[12%] hidden w-24 -rotate-12 text-muted/50 sm:block sm:w-32"
      viewBox="0 0 120 104"
      fill="none"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="12" y="44" width="96" height="48" rx="8" />
      <rect x="12" y="20" width="96" height="24" rx="6" />
      <path d="M34 20 L46 44 M60 20 L72 44 M86 20 L98 44" />
      <path d="M26 60 H70" class="text-secondary/70" />
      <path d="M26 74 H54" />
    </svg>

    <!-- Ingresso -->
    <svg
      class="illustration-float-delayed absolute right-[8%] top-[16%] hidden w-24 rotate-12 text-muted/50 sm:block sm:w-32"
      viewBox="0 0 130 76"
      fill="none"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M16 16 H114 V30 a8 8 0 0 0 0 16 V60 H16 V46 a8 8 0 0 0 0 -16 Z" />
      <path d="M84 16 V60" stroke-dasharray="5 7" />
      <path
        d="M50 26 L53.2 34.6 L62.4 35 L55.2 40.7 L57.6 49.5 L50 44.5 L42.4 49.5 L44.8 40.7 L37.6 35 L46.8 34.6 Z"
        stroke-width="3"
        class="text-secondary/70"
      />
    </svg>

    <!-- Pipoca -->
    <svg
      class="illustration-float absolute bottom-[10%] left-[12%] hidden w-20 rotate-6 text-muted/50 sm:block sm:w-28"
      viewBox="0 0 100 112"
      fill="none"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M24 48 L33 104 H67 L76 48" />
      <path d="M42 50 L45 104 M58 50 L55 104" />
      <circle cx="34" cy="40" r="10" />
      <circle cx="50" cy="30" r="11" class="text-secondary/70" />
      <circle cx="66" cy="40" r="10" />
      <circle cx="50" cy="44" r="9" />
    </svg>

    <!-- Câmera de cinema -->
    <svg
      class="illustration-float-delayed absolute bottom-[14%] right-[10%] hidden w-24 -rotate-6 text-muted/50 sm:block sm:w-32"
      viewBox="0 0 120 96"
      fill="none"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="34" cy="26" r="16" />
      <circle cx="70" cy="26" r="16" />
      <rect x="14" y="42" width="76" height="42" rx="8" />
      <path d="M90 56 L112 46 V80 L90 70" />
      <circle cx="34" cy="26" r="5" class="text-secondary/70" />
      <circle cx="70" cy="26" r="5" class="text-secondary/70" />
    </svg>
  `,
  styles: `
    @keyframes illustration-float {
      from {
        translate: 0 -6px;
      }
      to {
        translate: 0 6px;
      }
    }

    .illustration-float {
      animation: illustration-float 5s ease-in-out infinite alternate;
    }

    .illustration-float-delayed {
      animation: illustration-float 6s ease-in-out 1.5s infinite alternate;
    }

    @media (prefers-reduced-motion: reduce) {
      .illustration-float,
      .illustration-float-delayed {
        animation: none;
      }
    }
  `,
})
export class CinemaDoodles {
  readonly variant = input<CinemaDoodlesVariant>('hero');
}
