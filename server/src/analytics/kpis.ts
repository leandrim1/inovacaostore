import { prisma } from "../db.js";
import type { PeriodRange } from "../dateRanges.js";
import type { SalesRules } from "./rules.js";
import { effectiveSalesWhere } from "./rules.js";
import { loadOrderFinancialRows, pctChange, summarizeRows } from "./shared.js";

export interface KpiSummary {
  revenue: number;
  previousRevenue: number;
  revenueChangePct: number | null;
  netProfit: number;
  previousNetProfit: number;
  netProfitChangePct: number | null;
  marginPct: number | null;
  orderCount: number;
  previousOrderCount: number;
  orderCountChangePct: number | null;
  aov: number;
  previousAov: number;
  aovChangePct: number | null;
  unitsSold: number;
  previousUnitsSold: number;
  unitsSoldChangePct: number | null;
  costBreakdown: ReturnType<typeof summarizeRows>["costBreakdown"];
  hasEstimatedCosts: boolean;
}

export async function getKpiSummary(
  range: PeriodRange,
  previousRange: PeriodRange,
  rules: SalesRules,
): Promise<KpiSummary> {
  const [curData, prevData] = await Promise.all([
    loadOrderFinancialRows(range, rules),
    loadOrderFinancialRows(previousRange, rules),
  ]);

  const current = summarizeRows(curData.rows, curData.expenses, curData.platformFeePct);
  const previous = summarizeRows(prevData.rows, prevData.expenses, prevData.platformFeePct);

  const aov = current.orderCount ? current.revenue / current.orderCount : 0;
  const previousAov = previous.orderCount ? previous.revenue / previous.orderCount : 0;

  return {
    revenue: current.revenue,
    previousRevenue: previous.revenue,
    revenueChangePct: pctChange(current.revenue, previous.revenue),
    netProfit: current.netProfit,
    previousNetProfit: previous.netProfit,
    netProfitChangePct: pctChange(current.netProfit, previous.netProfit),
    marginPct: current.revenue > 0 ? (current.netProfit / current.revenue) * 100 : null,
    orderCount: current.orderCount,
    previousOrderCount: previous.orderCount,
    orderCountChangePct: pctChange(current.orderCount, previous.orderCount),
    aov,
    previousAov,
    aovChangePct: pctChange(aov, previousAov),
    unitsSold: current.unitsSold,
    previousUnitsSold: previous.unitsSold,
    unitsSoldChangePct: pctChange(current.unitsSold, previous.unitsSold),
    costBreakdown: current.costBreakdown,
    hasEstimatedCosts: current.hasEstimatedCosts,
  };
}

export interface CustomerBreakdown {
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
}

export async function getCustomerBreakdown(range: PeriodRange, rules: SalesRules): Promise<CustomerBreakdown> {
  const where = effectiveSalesWhere(rules);

  const inPeriod = await prisma.order.groupBy({
    by: ["customerId"],
    where: { ...where, createdAt: { gte: range.from, lt: range.to } },
  });
  const ids = inPeriod.map((r) => r.customerId);
  if (!ids.length) return { newCustomers: 0, returningCustomers: 0, totalCustomers: 0 };

  const firstOrders = await prisma.order.groupBy({
    by: ["customerId"],
    where: { ...where, customerId: { in: ids } },
    _min: { createdAt: true },
  });

  const newCustomers = firstOrders.filter((r) => r._min.createdAt != null && r._min.createdAt >= range.from).length;
  return { newCustomers, returningCustomers: ids.length - newCustomers, totalCustomers: ids.length };
}
