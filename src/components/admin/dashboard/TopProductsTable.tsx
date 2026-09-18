import { useState } from "react";
import { useProductRankings, type ProductSortBy } from "../../../hooks/admin/useAdminAnalytics";
import type { PeriodFilter } from "../../../lib/dateRanges";
import { formatBRL, formatPct } from "../../../lib/format";

const SORT_LABELS: Record<ProductSortBy, string> = {
  quantity: "Mais vendidos",
  revenue: "Maior faturamento",
  profit: "Maior lucro",
  margin: "Maior margem",
};

interface TopProductsTableProps {
  period: PeriodFilter;
  title: string;
  defaultSortBy: ProductSortBy;
  allowSortToggle?: boolean;
  limit?: number;
}

export function TopProductsTable({ period, title, defaultSortBy, allowSortToggle = false, limit = 10 }: TopProductsTableProps) {
  const [sortBy, setSortBy] = useState<ProductSortBy>(defaultSortBy);
  const { data, isLoading } = useProductRankings(period, sortBy, limit);
  const items = data?.items ?? [];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm tracking-widest text-neutral-500">{title.toUpperCase()}</h2>
        {allowSortToggle && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ProductSortBy)}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs outline-none focus:border-brand-ink"
          >
            {(Object.keys(SORT_LABELS) as ProductSortBy[]).map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
              <th className="py-2 pr-3">Produto</th>
              <th className="py-2 pr-3 text-right">Qtd.</th>
              <th className="py-2 pr-3 text-right">Faturamento</th>
              <th className="py-2 pr-3 text-right">Custo</th>
              <th className="py-2 pr-3 text-right">Lucro</th>
              <th className="py-2 pr-3 text-right">Margem</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  Carregando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  Nenhuma venda no período.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.productId} className="border-b border-black/5 last:border-0">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-9 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <span className="font-medium text-brand-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-right">{p.quantitySold}</td>
                  <td className="py-2.5 pr-3 text-right">{formatBRL(p.revenue)}</td>
                  <td className="py-2.5 pr-3 text-right text-neutral-500">{formatBRL(p.cost)}</td>
                  <td className={`py-2.5 pr-3 text-right ${p.profit >= 0 ? "text-green-700" : "text-red-600"}`}>
                    {formatBRL(p.profit)}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-neutral-500">{formatPct(p.marginPct)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
