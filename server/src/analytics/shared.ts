import { prisma } from "../db.js";
import type { PeriodRange } from "../dateRanges.js";
import { effectiveSalesWhere, getFinanceSettings, type SalesRules } from "./rules.js";
import { feePctForMethod, getExpensesInRange, reconstructShippingCost } from "./costs.js";

export interface OrderFinancialRow {
  id: string;
  createdAt: Date;
  total: number;
  discount: number;
  shippingPrice: number;
  paymentMethod: string;
  state: string;
  city: string;
  productCost: number;
  shippingCost: number;
  paymentFee: number;
  unitsSold: number;
  /** true se algum valor deste pedido (custo de produto ou de frete) foi estimado a partir de configuração atual, não de um snapshot real da época da compra. */
  isEstimate: boolean;
}

export interface LoadedFinancialData {
  rows: OrderFinancialRow[];
  expenses: { occurredAt: Date; amount: number }[];
  platformFeePct: number;
}

/**
 * Busca os pedidos "de venda efetiva" (conforme as regras) no período e
 * já calcula, linha a linha, custo de produto/frete e taxa de
 * pagamento. Esta é a única função que lê `Order`/`OrderItem` para fins
 * financeiros — toda métrica de dinheiro (KPIs, série temporal, ranking
 * de produtos, análise de frete, região, horário) deriva daqui, nunca
 * refaz a query por conta própria.
 */
export async function loadOrderFinancialRows(range: PeriodRange, rules: SalesRules): Promise<LoadedFinancialData> {
  const where = { createdAt: { gte: range.from, lt: range.to }, ...effectiveSalesWhere(rules) };

  const [orders, tiers, financeSettings, expenses] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        total: true,
        discount: true,
        shippingPrice: true,
        shippingDistanceKm: true,
        paymentMethod: true,
        state: true,
        city: true,
        items: {
          select: {
            quantity: true,
            unitCost: true,
            variant: { select: { product: { select: { costPrice: true } } } },
          },
        },
      },
    }),
    prisma.shippingTier.findMany({ orderBy: { minKm: "asc" } }),
    getFinanceSettings(),
    getExpensesInRange(range),
  ]);

  const rows: OrderFinancialRow[] = orders.map((order) => {
    let productCost = 0;
    let unitsSold = 0;
    let isEstimate = false;

    for (const item of order.items) {
      unitsSold += item.quantity;
      // item.unitCost é o snapshot gravado na criação do pedido; pedidos
      // anteriores à migration (ou com produto sem custo cadastrado na
      // época) têm unitCost=0 — nesse caso usamos o custo ATUAL do
      // produto como estimativa, nunca fingimos que o custo é zero.
      const unitCost = item.unitCost > 0 ? item.unitCost : item.variant.product.costPrice;
      if (item.unitCost <= 0 && unitCost > 0) isEstimate = true;
      productCost += unitCost * item.quantity;
    }

    const { cost: shippingCost, isEstimate: shippingIsEstimate } = reconstructShippingCost(order, tiers);
    const paymentFee = (order.total * feePctForMethod(order.paymentMethod, financeSettings)) / 100;

    return {
      id: order.id,
      createdAt: order.createdAt,
      total: order.total,
      discount: order.discount,
      shippingPrice: order.shippingPrice,
      paymentMethod: order.paymentMethod,
      state: order.state,
      city: order.city,
      productCost,
      shippingCost,
      paymentFee,
      unitsSold,
      isEstimate: isEstimate || shippingIsEstimate,
    };
  });

  return { rows, expenses, platformFeePct: financeSettings.platformFeePct };
}

function sumBy<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((sum, item) => sum + fn(item), 0);
}

export interface FinancialSummary {
  revenue: number;
  orderCount: number;
  unitsSold: number;
  netProfit: number;
  hasEstimatedCosts: boolean;
  costBreakdown: {
    productCost: number;
    shippingCost: number;
    paymentFees: number;
    platformFees: number;
    otherExpenses: number;
    discountTotal: number;
  };
}

/**
 * Soma um conjunto de linhas (já filtradas por período/faixa de tempo)
 * em um resumo financeiro. `Order.discount` NÃO é subtraído aqui: ele
 * já está embutido em `Order.total` (total = max(0,subtotal-discount)+
 * frete), então descontá-lo de novo duplicaria o desconto e subestimaria
 * o lucro. É só reportado para referência ("total de descontos
 * concedidos").
 */
export function summarizeRows(
  rows: OrderFinancialRow[],
  expensesSlice: { amount: number }[],
  platformFeePct: number,
): FinancialSummary {
  const revenue = sumBy(rows, (r) => r.total);
  const productCost = sumBy(rows, (r) => r.productCost);
  const shippingCost = sumBy(rows, (r) => r.shippingCost);
  const paymentFees = sumBy(rows, (r) => r.paymentFee);
  const platformFees = (revenue * platformFeePct) / 100;
  const otherExpenses = sumBy(expensesSlice, (e) => e.amount);
  const netProfit = revenue - productCost - shippingCost - paymentFees - platformFees - otherExpenses;

  return {
    revenue,
    orderCount: rows.length,
    unitsSold: sumBy(rows, (r) => r.unitsSold),
    netProfit,
    hasEstimatedCosts: rows.some((r) => r.isEstimate),
    costBreakdown: {
      productCost,
      shippingCost,
      paymentFees,
      platformFees,
      otherExpenses,
      discountTotal: sumBy(rows, (r) => r.discount),
    },
  };
}

/** Variação percentual entre dois valores. `null` (nunca um número inventado) quando o período anterior é zero e o atual não é. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
