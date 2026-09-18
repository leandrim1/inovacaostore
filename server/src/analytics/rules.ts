import type { FinanceSettings, Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { CANCELLED_STATUS, REFUNDED_STATUS } from "../orderStatus.js";

const DEFAULT_FINANCE_SETTINGS: Omit<FinanceSettings, "id" | "updatedAt"> = {
  paymentFeePixPct: 0,
  paymentFeeCardPct: 0,
  paymentFeeBoletoPct: 0,
  paymentFeeOtherPct: 0,
  platformFeePct: 0,
  includeCancelledOrders: false,
  includeRefundedOrders: false,
};

export interface SalesRules {
  includeCancelledOrders: boolean;
  includeRefundedOrders: boolean;
}

/**
 * Nunca falha se a linha singleton ainda não existir — analytics precisa
 * sempre responder algo sensato (tudo em 0/desativado), não 404.
 */
export async function getFinanceSettings(): Promise<FinanceSettings> {
  const settings = await prisma.financeSettings.findUnique({ where: { id: "singleton" } });
  if (settings) return settings;
  return { id: "singleton", updatedAt: new Date(), ...DEFAULT_FINANCE_SETTINGS };
}

export async function getSalesRules(): Promise<SalesRules> {
  const settings = await getFinanceSettings();
  return {
    includeCancelledOrders: settings.includeCancelledOrders,
    includeRefundedOrders: settings.includeRefundedOrders,
  };
}

/**
 * ÚNICO lugar que decide o que conta como "venda efetiva" (faturamento,
 * lucro, unidades, ticket médio). Toda query de analytics que soma
 * dinheiro DEVE compor este where — nunca reimplementar o filtro de
 * status. Exceção documentada nos próprios call sites: o painel de
 * status de pedidos e o gráfico de pedidos-por-status mostram TODOS os
 * status de propósito (existem para mostrar a distribuição completa),
 * então não usam esta função.
 */
export function effectiveSalesWhere(rules: SalesRules): Prisma.OrderWhereInput {
  const excluded: string[] = [];
  if (!rules.includeCancelledOrders) excluded.push(CANCELLED_STATUS);
  if (!rules.includeRefundedOrders) excluded.push(REFUNDED_STATUS);
  return excluded.length ? { status: { notIn: excluded } } : {};
}
