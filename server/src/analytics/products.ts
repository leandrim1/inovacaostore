import { prisma } from "../db.js";
import type { PeriodRange } from "../dateRanges.js";
import { effectiveSalesWhere, type SalesRules } from "./rules.js";

export type ProductSortBy = "quantity" | "revenue" | "profit" | "margin";

export interface ProductRanking {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number | null;
}

export async function getProductRankings(
  range: PeriodRange,
  rules: SalesRules,
  sortBy: ProductSortBy,
  limit = 20,
): Promise<ProductRanking[]> {
  const items = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: range.from, lt: range.to }, ...effectiveSalesWhere(rules) } },
    select: {
      quantity: true,
      price: true,
      unitCost: true,
      variant: {
        select: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              costPrice: true,
              images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
            },
          },
        },
      },
    },
  });

  const byProduct = new Map<string, ProductRanking>();
  for (const item of items) {
    const product = item.variant.product;
    // mesma lógica de fallback de shared.ts: sem snapshot, usa o custo atual
    const unitCost = item.unitCost > 0 ? item.unitCost : product.costPrice;
    const revenue = item.price * item.quantity;
    const cost = unitCost * item.quantity;

    const existing = byProduct.get(product.id);
    if (existing) {
      existing.quantitySold += item.quantity;
      existing.revenue += revenue;
      existing.cost += cost;
    } else {
      byProduct.set(product.id, {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images[0]?.url ?? null,
        quantitySold: item.quantity,
        revenue,
        cost,
        profit: 0,
        marginPct: null,
      });
    }
  }

  const rankings = Array.from(byProduct.values()).map((r) => ({
    ...r,
    profit: r.revenue - r.cost,
    marginPct: r.revenue > 0 ? ((r.revenue - r.cost) / r.revenue) * 100 : null,
  }));

  const sortKey: Record<ProductSortBy, (r: ProductRanking) => number> = {
    quantity: (r) => r.quantitySold,
    revenue: (r) => r.revenue,
    profit: (r) => r.profit,
    margin: (r) => r.marginPct ?? -Infinity,
  };
  rankings.sort((a, b) => sortKey[sortBy](b) - sortKey[sortBy](a));

  return rankings.slice(0, limit);
}
