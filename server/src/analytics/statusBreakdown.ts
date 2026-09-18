import { prisma } from "../db.js";
import type { PeriodRange } from "../dateRanges.js";

export interface StatusBreakdownItem {
  status: string;
  orderCount: number;
}

/**
 * Mostra TODOS os status de propósito, incluindo cancelado/reembolsado
 * — este painel existe para visualizar a distribuição completa dos
 * pedidos, não a receita, então não usa `effectiveSalesWhere` (mesma
 * exceção documentada em `series.ts`).
 */
export async function getStatusBreakdown(range: PeriodRange): Promise<StatusBreakdownItem[]> {
  const groups = await prisma.order.groupBy({
    by: ["status"],
    where: { createdAt: { gte: range.from, lt: range.to } },
    _count: true,
  });
  return groups.map((g) => ({ status: g.status, orderCount: g._count }));
}
