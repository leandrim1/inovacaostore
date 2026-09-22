import { usePaymentMethodBreakdown } from "../../../hooks/admin/useAdminAnalytics";
import type { PeriodFilter } from "../../../lib/dateRanges";
import { formatBRL } from "../../../lib/format";
import { paymentMethodLabel } from "../../../lib/paymentMethods";
import { paymentMethodColor } from "./chartColors";

interface PaymentMethodsPanelProps {
  period: PeriodFilter;
}

export function PaymentMethodsPanel({ period }: PaymentMethodsPanelProps) {
  const { data, isLoading } = usePaymentMethodBreakdown(period);
  const items = data?.items ?? [];
  const total = items.reduce((sum, i) => sum + i.revenue, 0);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">FORMAS DE PAGAMENTO</h2>
      {isLoading ? (
        <p className="py-8 text-center text-sm text-neutral-400">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">Nenhum pedido no período.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => {
            const pct = total > 0 ? (item.revenue / total) * 100 : 0;
            const color = paymentMethodColor(i);
            return (
              <div key={item.method}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-brand-ink">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {paymentMethodLabel(item.method)}
                  </span>
                  <span className="text-neutral-500">
                    {pct.toFixed(0)}% · {formatBRL(item.revenue)} · {item.orderCount} pedido(s)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
