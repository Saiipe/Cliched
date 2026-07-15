import type { AdminGameOption } from './admin-game-option.model';

/** Opções administrativas por modo de jogo. Só o desafio diário tem tela
 * própria hoje — os demais aparecem com a opção desabilitada, comunicando a
 * estrutura prevista sem simular uma navegação que ainda não existe. */
export const ADMIN_GAME_OPTIONS: Readonly<Record<string, readonly AdminGameOption[]>> = {
  daily: [{ label: 'Configurar desafio de amanhã', route: '/admin/desafio-diario' }],
};

export const DEFAULT_ADMIN_GAME_OPTIONS: readonly AdminGameOption[] = [
  { label: 'Ainda sem configurações administrativas para este modo', route: null },
];
