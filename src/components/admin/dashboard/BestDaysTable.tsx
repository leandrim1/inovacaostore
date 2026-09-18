import { useBestDays } from "../../../hooks/admin/useAdminAnalytics";
import type { PeriodFilter } from "../../../lib/dateRanges";
import { formatBRL } from "../../../lib/format";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

interface BestDaysTableProps {
  period: PeriodFilter;
}

export function BestDaysTable({ period }: BestDaysTableProps) {
  const { data, isLoading } = useBestDays(period, 10);
  const items = data?.items ?? [];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">DIAS COM MAIOR FATURAMENTO</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
              <th className="py-2 pr-3">Dia</th>
              <th className="py-2 pr-3 text-right">Pedidos</th>
              <th className="py-2 pr-3 text-right">Faturamento</th>
              <th className="py-2 pr-3 text-right">Lucro</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-neutral-400">
                  Carregando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-neutral-400">
                  Nenhuma venda no período.
                </td>
              </tr>
            ) : (
              items.map((day) => (
                <tr key={day.date} className="border-b border-black/5 last:border-0">
                  <td className="py-2.5 pr-3 font-medium text-brand-ink">{formatDate(day.date)}</td>
                  <td className="py-2.5 pr-3 text-right">{day.orderCount}</td>
                  <td className="py-2.5 pr-3 text-right">{formatBRL(day.revenue)}</td>
                  <td className="py-2.5 pr-3 text-right text-neutral-500">{formatBRL(day.netProfit)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
