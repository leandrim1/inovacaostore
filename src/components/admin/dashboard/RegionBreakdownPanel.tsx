import { useState } from "react";
import { useRegionBreakdown, type RegionGroupBy } from "../../../hooks/admin/useAdminAnalytics";
import type { PeriodFilter } from "../../../lib/dateRanges";
import { formatBRL } from "../../../lib/format";

const GROUP_LABELS: Record<RegionGroupBy, string> = {
  state: "Estado",
  city: "Cidade",
  macro: "Região do Brasil",
};

interface RegionBreakdownPanelProps {
  period: PeriodFilter;
}

export function RegionBreakdownPanel({ period }: RegionBreakdownPanelProps) {
  const [groupBy, setGroupBy] = useState<RegionGroupBy>("state");
  const { data, isLoading } = useRegionBreakdown(period, groupBy);
  const items = (data?.items ?? []).slice(0, 8);
  const maxRevenue = Math.max(1, ...items.map((i) => i.revenue));

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm tracking-widest text-neutral-500">VENDAS POR REGIÃO</h2>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as RegionGroupBy)}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs outline-none focus:border-brand-ink"
        >
          {(Object.keys(GROUP_LABELS) as RegionGroupBy[]).map((g) => (
            <option key={g} value={g}>
              {GROUP_LABELS[g]}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-neutral-400">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">Nenhum pedido no período.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.key}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className="font-medium text-brand-ink">{item.key}</span>
                <span className="text-xs text-neutral-500">
                  {item.orderCount} pedido(s) · {formatBRL(item.revenue)} · ticket médio {formatBRL(item.aov)} · lucro{" "}
                  {formatBRL(item.profit)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-brand-ink"
                  style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
