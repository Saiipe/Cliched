/**
 * Pontos da aplicação onde anúncios podem ser exibidos.
 * Deliberadamente NÃO inclui momentos de gameplay (leitura de sinopse, resposta,
 * contagem regressiva, desafios em tempo real) — a ausência desses valores impede,
 * a nível de tipo, que qualquer código solicite anúncio nesses momentos.
 */
export enum AdPlacement {
  Home = 'home',
  Catalog = 'catalog',
  Ranking = 'ranking',
  Result = 'result',
  Profile = 'profile',
}
