import type { PeriodRange } from "../dateRanges.js";
import type { SalesRules } from "./rules.js";
import { loadOrderFinancialRows } from "./shared.js";

export type RegionGroupBy = "state" | "city" | "macro";

const STATE_TO_MACRO_REGION: Record<string, string> = {
  AC: "Norte",
  AP: "Norte",
  AM: "Norte",
  PA: "Norte",
  RO: "Norte",
  RR: "Norte",
  TO: "Norte",
  AL: "Nordeste",
  BA: "Nordeste",
  CE: "Nordeste",
  MA: "Nordeste",
  PB: "Nordeste",
  PE: "Nordeste",
  PI: "Nordeste",
  RN: "Nordeste",
  SE: "Nordeste",
  DF: "Centro-Oeste",
  GO: "Centro-Oeste",
  MT: "Centro-Oeste",
  MS: "Centro-Oeste",
  ES: "Sudeste",
  MG: "Sudeste",
  RJ: "Sudeste",
  SP: "Sudeste",
  PR: "Sul",
  RS: "Sul",
  SC: "Sul",
};

export interface RegionBreakdownItem {
  key: string;
  orderCount: number;
  revenue: number;
  aov: number;
  /** Lucro atribuível ao pedido (custo de produto/frete/taxa de pagamento); não inclui taxa de plataforma nem despesas gerais do período, que não são atribuíveis a uma região específica. */
  profit: number;
}

export async function getRegionBreakdown(
  range: PeriodRange,
  rules: SalesRules,
  groupBy: RegionGroupBy,
): Promise<RegionBreakdownItem[]> {
  const { rows } = await loadOrderFinancialRows(range, rules);
  const grouped = new Map<string, { orderCount: number; revenue: number; profit: number }>();

  for (const row of rows) {
    const key =
      groupBy === "state"
        ? row.state
        : groupBy === "city"
          ? `${row.city} - ${row.state}`
          : (STATE_TO_MACRO_REGION[row.state.toUpperCase()] ?? "Não identificado");

    const rowProfit = row.total - row.productCost - row.shippingCost - row.paymentFee;
    const existing = grouped.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.revenue += row.total;
      existing.profit += rowProfit;
    } else {
      grouped.set(key, { orderCount: 1, revenue: row.total, profit: rowProfit });
    }
  }

  return Array.from(grouped.entries())
    .map(([key, v]) => ({
      key,
      orderCount: v.orderCount,
      revenue: v.revenue,
      profit: v.profit,
      aov: v.orderCount ? v.revenue / v.orderCount : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
