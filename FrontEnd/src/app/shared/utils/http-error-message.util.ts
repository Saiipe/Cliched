import { HttpErrorResponse } from '@angular/common/http';

const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';

/** Traduz erros de requisição HTTP pra mensagens em português.
 *
 * `error.status === 0` é falha de rede de verdade (servidor fora do ar,
 * CORS bloqueado, sem internet): nesse caso `error.error` não é o corpo
 * JSON da nossa API, é o erro cru que o `fetch()` do navegador joga (ex.:
 * "Failed to fetch"), em inglês. Sem checar o status antes, `error.error
 * ?.message` acaba devolvendo esse texto cru pro usuário. */
export function resolveApiErrorMessage(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 0) {
    return NETWORK_ERROR_MESSAGE;
  }
  const message = error.error?.message;
  return typeof message === 'string' && message.length > 0 ? message : fallback;
}
