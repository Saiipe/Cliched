import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminHeader } from '../admin-header/admin-header';

@Component({
  selector: 'app-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, AdminHeader],
  template: `
    <app-admin-header />
    <main class="min-h-[calc(100dvh-4rem)] bg-bg text-foreground">
      <router-outlet />
    </main>
  `,
})
export class AdminShell {}
