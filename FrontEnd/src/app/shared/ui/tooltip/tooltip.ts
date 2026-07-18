import { OverlayModule, type ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal } from '@angular/core';

/** Tooltip acessível e utilizável em telas touch: o `title` nativo do
 * HTML não abre com toque (sem hover em mobile). Usa `CdkConnectedOverlay`
 * em vez de um `<span absolute>` comum: um `<span>` fica preso dentro de
 * qualquer ancestral com `overflow-x-auto`/`overflow-hidden` (como o
 * wrapper de rolagem da tabela de ranking) e aparece cortado; o overlay
 * do CDK renderiza num container à parte, anexado ao `<body>`, então
 * escapa desse clipping e ainda inverte de posição sozinho se não couber
 * na tela. Hover/foco no desktop, clique no touch — tudo no mesmo
 * elemento (`<ng-content>` inteiro é o gatilho, não só um ícone).
 *
 * De propósito **sem** `cdkConnectedOverlayHasBackdrop`: um backdrop
 * cobre o próprio botão gatilho, e o navegador dispara `mouseleave`
 * nele assim que outro elemento passa a ficar por cima (mesmo sem o
 * mouse ter se movido) — fechava o tooltip um instante depois de abrir
 * por hover. Fechar por clique fora é feito à mão via
 * `(document:click)`, que não tem esse efeito colateral. */
@Component({
  selector: 'app-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayModule],
  host: {
    class: 'relative inline-flex',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <button
      type="button"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      class="inline-flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      [attr.aria-expanded]="open()"
      (click)="onTriggerClick($event)"
      (mouseenter)="show()"
      (mouseleave)="hide()"
      (focus)="show()"
      (blur)="hide()"
    >
      <ng-content />
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
    >
      <span
        role="tooltip"
        class="pointer-events-none block w-56 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-foreground shadow-lg"
      >
        {{ text() }}
      </span>
    </ng-template>
  `,
})
export class Tooltip {
  readonly text = input.required<string>();

  protected readonly open = signal(false);

  protected readonly positions: ConnectedPosition[] = [
    { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
  ];

  private readonly hostRef = inject(ElementRef<HTMLElement>);

  /** Sempre abre (nunca fecha), mesmo que o hover já tenha aberto antes:
   * um toggle aqui fecharia de novo na hora (hover abre, clique fecha),
   * o oposto do pedido ("clicar também deve mostrar"). Fechar é por
   * clique fora ou tirando o mouse de cima. */
  protected onTriggerClick(event: MouseEvent): void {
    event.stopPropagation();
    this.open.set(true);
  }

  protected show(): void {
    this.open.set(true);
  }

  protected hide(): void {
    this.open.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.hostRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
