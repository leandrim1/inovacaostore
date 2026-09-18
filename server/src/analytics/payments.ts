import { prisma } from "../db.js";
import type { PeriodRange } from "../dateRanges.js";
import { effectiveSalesWhere, type SalesRules } from "./rules.js";

export interface PaymentMethodBreakdownItem {
  method: string;
  orderCount: number;
  revenue: number;
}

export async function getPaymentMethodBreakdown(
  range: PeriodRange,
  rules: SalesRules,
): Promise<PaymentMethodBreakdownItem[]> {
  const groups = await prisma.order.groupBy({
    by: ["paymentMethod"],
    where: { createdAt: { gte: range.from, lt: range.to }, ...effectiveSalesWhere(rules) },
    _sum: { total: true },
    _count: true,
  });

  return groups
    .map((g) => ({ method: g.paymentMethod, orderCount: g._count, revenue: g._sum.total ?? 0 }))
    .sort((a, b) => b.revenue - a.revenue);
}
