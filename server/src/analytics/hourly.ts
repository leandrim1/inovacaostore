import { toBrParts, type PeriodRange } from "../dateRanges.js";
import type { SalesRules } from "./rules.js";
import { loadOrderFinancialRows } from "./shared.js";

export interface HourlyPatternItem {
  hour: number;
  orderCount: number;
  revenue: number;
}

/** 24 buckets (hora local BR), sempre todos presentes mesmo sem pedidos. */
export async function getHourlyPattern(range: PeriodRange, rules: SalesRules): Promise<HourlyPatternItem[]> {
  const { rows } = await loadOrderFinancialRows(range, rules);
  const buckets: HourlyPatternItem[] = Array.from({ length: 24 }, (_, hour) => ({ hour, orderCount: 0, revenue: 0 }));

  for (const row of rows) {
    const { hour } = toBrParts(row.createdAt);
    buckets[hour].orderCount += 1;
    buckets[hour].revenue += row.total;
  }

  return buckets;
}
