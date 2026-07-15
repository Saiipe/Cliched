import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Sessão do desafio diário depende do token anônimo salvo no localStorage
    // do navegador (não existe durante o SSR). Se essa rota fosse
    // pré-renderizada/SSR, a resposta da API sem token viraria cache de
    // transferência e a hidratação reaproveitaria esse estado "sem sessão"
    // em vez de refazer a chamada no cliente com o token real — por isso
    // precisa ficar fora do Prerender, renderizando só no navegador.
    path: 'jogar/diario',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
