import { Injectable, signal } from '@angular/core';

/**
 * Saldo de moedas do usuário. Hoje só em memória (começa em 0) — quando
 * houver backend, a leitura/persistência do saldo passa a vir de lá, sem
 * mudar a API pública deste service.
 */
@Injectable({ providedIn: 'root' })
export class CoinsService {
  private readonly balance = signal(0);

  getBalance() {
    return this.balance.asReadonly();
  }

  addCoins(amount: number): void {
    this.balance.update((current) => current + amount);
  }

  spendCoins(amount: number): boolean {
    if (this.balance() < amount) {
      return false;
    }

    this.balance.update((current) => current - amount);
    return true;
  }
}
