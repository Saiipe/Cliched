import { Routes } from '@angular/router';

export const routes: Routes = [
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
      import('./features/ranking/pages/ranking-page/ranking-page').then((m) => m.RankingPage),
  },
  {
    path: 'sobre',
    loadComponent: () =>
      import('./features/about/pages/about-page/about-page').then((m) => m.AboutPage),
  },
];
