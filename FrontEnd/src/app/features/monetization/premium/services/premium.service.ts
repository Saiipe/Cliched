import { Injectable, computed, signal } from '@angular/core';
import { PremiumPlan } from '../models/premium-plan.enum';

/**
 * Fonte única de verdade sobre o plano do usuário. Hoje fixo em `Free`
 * (sem integração com pagamento/assinatura ainda) — quando `subscriptions`
 * for implementado, ele passa a atualizar este signal em vez de um valor fixo.
 */
@Injectable({ providedIn: 'root' })
export class PremiumService {
  private readonly plan = signal<PremiumPlan>(PremiumPlan.Free);

  readonly isPremium = computed(() => this.plan() === PremiumPlan.Premium);

  getPlan() {
    return this.plan.asReadonly();
  }
}
