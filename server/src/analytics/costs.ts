import type { FinanceSettings, ShippingTier } from "@prisma/client";
import { prisma } from "../db.js";
import type { PeriodRange } from "../dateRanges.js";

/**
 * Reconstrói o custo de frete de um pedido casando a distância gravada
 * com a tabela de faixas ATUAL. O pedido não grava qual faixa foi usada
 * no momento da compra, então isso é uma aproximação para faixas cujo
 * preço/custo mudou desde então — sinalizada via `isEstimate`. Pedidos
 * sem distância (frete grátis por valor/região, fallback, desativado)
 * não têm custo de frete rastreável por pedido: contam R$0 e também
 * ficam marcados como estimativa (nunca inventamos um número).
 */
export function reconstructShippingCost(
  order: { shippingDistanceKm: number | null },
  tiers: ShippingTier[],
): { cost: number; isEstimate: boolean } {
  if (order.shippingDistanceKm == null) {
    return { cost: 0, isEstimate: true };
  }
  const km = order.shippingDistanceKm;
  const tier = tiers.find((t) => km >= t.minKm && (t.maxKm === null || km < t.maxKm));
  if (!tier || tier.costPrice == null) {
    return { cost: 0, isEstimate: true };
  }
  return { cost: tier.costPrice, isEstimate: false };
}

export function feePctForMethod(method: string, settings: FinanceSettings): number {
  switch (method) {
    case "pix":
      return settings.paymentFeePixPct;
    case "cartao":
      return settings.paymentFeeCardPct;
    case "boleto":
      return settings.paymentFeeBoletoPct;
    default:
      return settings.paymentFeeOtherPct;
  }
}

export async function getExpensesInRange(range: PeriodRange) {
  return prisma.expense.findMany({
    where: { occurredAt: { gte: range.from, lt: range.to } },
    orderBy: { occurredAt: "asc" },
  });
}
