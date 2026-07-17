import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // A Home lê os destaques configurados no admin (dado global — não
    // depende de sessão do navegador, então não sofre o problema acima —
    // mas muda a qualquer momento sem passar por um novo build). SSR por
    // requisição em vez de prerender estático, senão a Home ficaria presa
    // no snapshot do build até o próximo deploy.
    path: '',
    renderMode: RenderMode.Server,
  },
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
    // Todo o /admin exige sessão (adminGuard lê o token do localStorage,
    // que não existe em SSR/build) — precisa renderizar só no navegador.
    path: 'admin',
    renderMode: RenderMode.Client,
  },
  {
    // Mesmo motivo: consome a API admin ao carregar (e criaria o desafio de
    // amanhã em build-time se fosse pré-renderizada).
    path: 'admin/desafio-diario',
    renderMode: RenderMode.Client,
  },
  {
    // Painel de gerência dos modos de jogo — interativo e sem valor de SEO,
    // mesmo tratamento das outras telas admin acima.
    path: 'admin/jogos',
    renderMode: RenderMode.Client,
  },
  {
    // Editor de arrastar-e-soltar dos destaques da Home — mesmo motivo.
    path: 'admin/configuracoes',
    renderMode: RenderMode.Client,
  },
  {
    // Lista de usuários + histórico de login, consumida via API — mesmo
    // motivo das outras telas admin acima.
    path: 'admin/usuarios',
    renderMode: RenderMode.Client,
  },
  {
    // Guardada por token no localStorage — em prerender não existe sessão,
    // o guard redirecionaria pro /login em build-time.
    path: 'alterar-senha',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
