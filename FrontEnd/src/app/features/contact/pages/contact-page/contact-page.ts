import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconMessageCircle, IconWorld } from '@tabler/icons-angular';
import { Icon } from '../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-contact-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <section class="mx-auto max-w-2xl px-6 py-16">
      <h1 class="text-4xl font-bold text-foreground">Contato</h1>
      <p class="mt-3 text-muted">
        Achou um bug, tem uma sugestão de modo de jogo ou só quer trocar uma ideia sobre cinema?
        Fale com a gente pelos canais abaixo.
      </p>

      <div class="mt-8 space-y-3">
        <a
          href="#"
          class="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-secondary/60"
        >
          <span class="flex size-10 items-center justify-center rounded-lg bg-surface-elevated">
            <app-icon [icon]="discordIcon" [size]="18" />
          </span>
          <span>
            <span class="block text-sm font-medium text-foreground">Discord</span>
            <span class="block text-xs text-muted">Comunidade oficial do Cliched</span>
          </span>
        </a>

        <a
          href="#"
          class="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-secondary/60"
        >
          <span class="flex size-10 items-center justify-center rounded-lg bg-surface-elevated">
            <app-icon [icon]="siteIcon" [size]="18" />
          </span>
          <span>
            <span class="block text-sm font-medium text-foreground">Site oficial</span>
            <span class="block text-xs text-muted">Novidades e anúncios da plataforma</span>
          </span>
        </a>
      </div>

      <p class="mt-8 text-xs text-muted">
        Formulário de contato e e-mail dedicado ainda estão em construção. Por enquanto, os
        canais de comunidade são a forma mais rápida de falar com a gente.
      </p>
    </section>
  `,
})
export class ContactPage {
  protected readonly discordIcon = IconMessageCircle;
  protected readonly siteIcon = IconWorld;
}
