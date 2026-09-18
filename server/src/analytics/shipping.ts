import { prisma } from "../db.js";
import type { PeriodRange } from "../dateRanges.js";
import type { SalesRules } from "./rules.js";
import { loadOrderFinancialRows } from "./shared.js";

export interface ShippingAnalysis {
  totalChargedToCustomers: number;
  totalCostToStore: number;
  difference: number;
  deliveredOrderCount: number;
  avgCostPerOrder: number;
  avgPricePerOrder: number;
  hasEstimatedCosts: boolean;
}

export async function getShippingAnalysis(range: PeriodRange, rules: SalesRules): Promise<ShippingAnalysis> {
  const { rows } = await loadOrderFinancialRows(range, rules);
  const totalChargedToCustomers = rows.reduce((sum, r) => sum + r.shippingPrice, 0);
  const totalCostToStore = rows.reduce((sum, r) => sum + r.shippingCost, 0);

  // "Pedidos entregues" no sentido literal do pedido do usuário — não passa
  // por effectiveSalesWhere, é uma contagem operacional específica do status "entregue".
  const deliveredOrderCount = await prisma.order.count({
    where: { createdAt: { gte: range.from, lt: range.to }, status: "entregue" },
  });

  const n = rows.length;
  return {
    totalChargedToCustomers,
    totalCostToStore,
    difference: totalChargedToCustomers - totalCostToStore,
    deliveredOrderCount,
    avgCostPerOrder: n ? totalCostToStore / n : 0,
    avgPricePerOrder: n ? totalChargedToCustomers / n : 0,
    hasEstimatedCosts: rows.some((r) => r.isEstimate),
  };
}
