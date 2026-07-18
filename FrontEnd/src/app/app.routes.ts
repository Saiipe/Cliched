import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { map, of } from 'rxjs';

import { AuthModalService } from './features/auth/services/auth-modal.service';
import { AuthService } from './features/auth/services/auth.service';
import { TokenStorageService } from './core/services/token-storage.service';

/** Painel admin exige sessão + `is_superuser`. Sem token, abre o modal de
 * login; logado mas sem a flag, só redireciona (não é problema de sessão,
 * e sim falta de permissão, então abrir o modal de novo não ajudaria). Num hard
 * refresh o perfil ainda pode não estar em cache, então espera a resposta
 * de `users/me/` em vez de confiar só no signal local. */
const adminGuard = () => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);

  if (storage.access() === null) {
    inject(AuthModalService).open('login');
    return of(router.createUrlTree(['/']));
  }

  const auth = inject(AuthService);
  const cachedUser = auth.user();
  if (cachedUser) {
    return of(cachedUser.is_superuser || router.createUrlTree(['/']));
  }

  return auth
    .fetchMe()
    .pipe(map((payload) => (payload?.user.is_superuser ? true : router.createUrlTree(['/']))));
};

export const routes: Routes = [
  {
    // Precisa vir antes do shell público: 'path: ""' abaixo casa com
    // qualquer URL (consome zero segmentos) e tem um '**' interno para o
    // 404 público. Se 'admin' viesse depois, /admin seria engolido por
    // esse wildcard antes mesmo de chegar aqui.
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/layout/admin-shell/admin-shell').then((m) => m.AdminShell),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/dashboard/pages/dashboard-page/dashboard-page').then(
            (m) => m.DashboardPage,
          ),
      },
      {
        path: 'jogos',
        loadComponent: () =>
          import('./features/admin/games/pages/games-page/games-page').then(
            (m) => m.AdminGamesPage,
          ),
      },
      {
        path: 'desafio-diario',
        loadComponent: () =>
          import(
            './features/admin/daily-challenge/pages/daily-challenge-page/daily-challenge-page'
          ).then((m) => m.AdminDailyChallengePage),
      },
      {
        path: 'elenco',
        loadComponent: () =>
          import('./features/admin/cast/pages/cast-admin-page/cast-admin-page').then(
            (m) => m.CastAdminPage,
          ),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./features/admin/settings/pages/settings-page/settings-page').then(
            (m) => m.AdminSettingsPage,
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/users/pages/users-page/users-page').then(
            (m) => m.AdminUsersPage,
          ),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layouts/public-shell/public-shell').then((m) => m.PublicShell),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/pages/home-page/home-page').then((m) => m.HomePage),
      },
      {
        path: 'jogar',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/catalog/pages/catalog-page/catalog-page').then(
                (m) => m.CatalogPage,
              ),
          },
          {
            path: 'diario',
            loadComponent: () =>
              import('./features/daily/pages/daily-page/daily-page').then(
                (m) => m.DailyPage,
              ),
          },
          {
            path: 'elenco',
            loadComponent: () =>
              import('./features/cast/pages/cast-page/cast-page').then(
                (m) => m.CastPage,
              ),
          },
        ],
      },
      {
        path: 'ranking',
        loadComponent: () =>
          import('./features/ranking/pages/ranking-page/ranking-page').then(
            (m) => m.RankingPage,
          ),
      },
      {
        path: 'sobre',
        loadComponent: () =>
          import('./features/about/pages/about-page/about-page').then((m) => m.AboutPage),
      },
      {
        path: 'contato',
        loadComponent: () =>
          import('./features/contact/pages/contact-page/contact-page').then(
            (m) => m.ContactPage,
          ),
      },
      {
        path: 'privacidade',
        data: { legalType: 'privacidade' },
        loadComponent: () =>
          import('./features/legal/pages/legal-page/legal-page').then((m) => m.LegalPage),
      },
      {
        path: 'termos',
        data: { legalType: 'termos' },
        loadComponent: () =>
          import('./features/legal/pages/legal-page/legal-page').then((m) => m.LegalPage),
      },
      {
        path: 'cookies',
        data: { legalType: 'cookies' },
        loadComponent: () =>
          import('./features/legal/pages/legal-page/legal-page').then((m) => m.LegalPage),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/pages/not-found-page/not-found-page').then(
            (m) => m.NotFoundPage,
          ),
      },
    ],
  },
  {
    // Nunca deveria ser alcançado na prática (o '**' do shell público
    // acima já cobre qualquer URL que não seja 'admin'). Fica só como
    // rede de segurança.
    path: '**',
    loadComponent: () =>
      import('./features/not-found/pages/not-found-page/not-found-page').then(
        (m) => m.NotFoundPage,
      ),
  },
];
