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
        loadComponent: () =>
          import('./features/catalog/pages/catalog-page/catalog-page').then((m) => m.CatalogPage),
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
    ],
  },
];
