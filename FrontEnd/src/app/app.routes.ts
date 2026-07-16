import { Routes } from '@angular/router';

export const routes: Routes = [
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
    ],
  },
  {
    path: 'admin',
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
        path: 'configuracoes',
        loadComponent: () =>
          import('./features/admin/settings/pages/settings-page/settings-page').then(
            (m) => m.AdminSettingsPage,
          ),
      },
    ],
  },
];
