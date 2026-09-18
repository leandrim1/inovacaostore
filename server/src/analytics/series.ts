import { prisma } from "../db.js";
import { bucketKey, enumerateBuckets, type Granularity, type PeriodRange } from "../dateRanges.js";
import type { SalesRules } from "./rules.js";
import { loadOrderFinancialRows, summarizeRows, type OrderFinancialRow } from "./shared.js";

export interface RevenueSeriesPoint {
  key: string;
  date: string;
  revenue: number;
  netProfit: number;
  orderCount: number;
  aov: number;
}

/**
 * Uma única busca ao banco para o período inteiro; o agrupamento por
 * bucket (hora/dia/mês) acontece em memória — ver nota em
 * `dateRanges.ts` sobre por que isso é preferível a `DATE_TRUNC` cru.
 */
export async function getRevenueSeries(
  range: PeriodRange,
  rules: SalesRules,
  granularity: Granularity,
): Promise<RevenueSeriesPoint[]> {
  const { rows, expenses, platformFeePct } = await loadOrderFinancialRows(range, rules);
  const buckets = enumerateBuckets(range, granularity);

  const rowsByBucket = new Map<string, OrderFinancialRow[]>();
  for (const row of rows) {
    const key = bucketKey(row.createdAt, granularity);
    const arr = rowsByBucket.get(key);
    if (arr) arr.push(row);
    else rowsByBucket.set(key, [row]);
  }

  const expensesByBucket = new Map<string, { amount: number }[]>();
  for (const expense of expenses) {
    const key = bucketKey(expense.occurredAt, granularity);
    const arr = expensesByBucket.get(key);
    if (arr) arr.push(expense);
    else expensesByBucket.set(key, [expense]);
  }

  return buckets.map(({ key, date }) => {
    const summary = summarizeRows(rowsByBucket.get(key) ?? [], expensesByBucket.get(key) ?? [], platformFeePct);
    return {
      key,
      date: date.toISOString(),
      revenue: summary.revenue,
      netProfit: summary.netProfit,
      orderCount: summary.orderCount,
      aov: summary.orderCount ? summary.revenue / summary.orderCount : 0,
    };
  });
}

export interface OrdersByStatusPoint {
  key: string;
  date: string;
  counts: Record<string, number>;
}

/**
 * Mostra TODOS os status de propósito (incluindo cancelado/reembolsado)
 * — existe para visualizar a distribuição completa dos pedidos, não a
 * receita. Por isso não usa `effectiveSalesWhere`.
 */
export async function getOrdersByStatusSeries(range: PeriodRange, granularity: Granularity): Promise<OrdersByStatusPoint[]> {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: range.from, lt: range.to } },
    select: { createdAt: true, status: true },
  });

  const countsByBucket = new Map<string, Record<string, number>>();
  for (const order of orders) {
    const key = bucketKey(order.createdAt, granularity);
    const rec = countsByBucket.get(key) ?? {};
    rec[order.status] = (rec[order.status] ?? 0) + 1;
    countsByBucket.set(key, rec);
  }

  return enumerateBuckets(range, granularity).map(({ key, date }) => ({
    key,
    date: date.toISOString(),
    counts: countsByBucket.get(key) ?? {},
  }));
}

export interface BestDayPoint {
  date: string;
  orderCount: number;
  revenue: number;
  netProfit: number;
}

/**
 * Ranking por dia civil (BR-local), sempre — independente da
 * granularidade do gráfico principal. "Ver por semana/mês/ano" do
 * pedido original é coberto pelos próprios presets de período (o
 * admin já escolhe "este mês"/"este ano" no filtro do topo); esta
 * tabela sempre responde "quais DIAS, dentro do período escolhido,
 * venderam mais".
 */
export async function getBestDays(range: PeriodRange, rules: SalesRules, limit = 10): Promise<BestDayPoint[]> {
  const series = await getRevenueSeries(range, rules, "day");
  return series
    .map((p) => ({ date: p.date, orderCount: p.orderCount, revenue: p.revenue, netProfit: p.netProfit }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
