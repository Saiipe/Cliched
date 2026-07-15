import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith } from 'rxjs';

function msUntilNextLocalMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return nextMidnight.getTime() - now.getTime();
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

@Component({
  selector: 'app-next-challenge-countdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-border bg-bg p-4">
      <p class="text-xs uppercase tracking-[0.18em] text-muted">Próximo desafio em</p>
      <p class="mt-2 text-2xl font-semibold tabular-nums text-foreground">{{ label() }}</p>
    </div>
  `,
})
export class NextChallengeCountdown {
  private readonly destroyRef = inject(DestroyRef);

  readonly next = output<void>();

  protected readonly label = signal(formatDuration(msUntilNextLocalMidnight()));

  private notifiedNext = false;

  constructor() {
    interval(1000)
      .pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const remaining = msUntilNextLocalMidnight();
        this.label.set(formatDuration(remaining));

        if (remaining <= 0 && !this.notifiedNext) {
          this.notifiedNext = true;
          this.next.emit();
        } else if (remaining > 1000) {
          this.notifiedNext = false;
        }
      });
  }
}
