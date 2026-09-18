import { useStatusBreakdown } from "../../../hooks/admin/useAdminAnalytics";
import type { PeriodFilter } from "../../../lib/dateRanges";
import { ORDER_STATUSES, STATUS_LABELS } from "../../../lib/orderStatus";

interface StatusBreakdownPanelProps {
  period: PeriodFilter;
}

export function StatusBreakdownPanel({ period }: StatusBreakdownPanelProps) {
  const { data, isLoading } = useStatusBreakdown(period);
  const counts = new Map((data?.items ?? []).map((i) => [i.status, i.orderCount]));
  const total = Array.from(counts.values()).reduce((s, c) => s + c, 0);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">STATUS DOS PEDIDOS</h2>
      {isLoading ? (
        <p className="py-8 text-center text-sm text-neutral-400">Carregando…</p>
      ) : total === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">Nenhum pedido no período.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ORDER_STATUSES.map((status) => {
            const count = counts.get(status) ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={status} className="rounded-xl bg-neutral-50 p-3">
                <p className="text-xs font-medium text-neutral-500">{STATUS_LABELS[status]}</p>
                <p className="mt-1 font-display text-xl text-brand-ink">{count}</p>
                <p className="text-xs text-neutral-400">{pct.toFixed(0)}%</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
