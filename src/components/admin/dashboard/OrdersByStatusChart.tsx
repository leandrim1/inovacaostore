import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useOrdersByStatusSeries } from "../../../hooks/admin/useAdminAnalytics";
import { formatSeriesKey, type PeriodFilter } from "../../../lib/dateRanges";
import { ORDER_STATUSES, STATUS_LABELS } from "../../../lib/orderStatus";
import { CHART_GRID_COLOR, CHART_MUTED_TEXT, STATUS_COLORS } from "./chartColors";

interface OrdersByStatusChartProps {
  period: PeriodFilter;
}

export function OrdersByStatusChart({ period }: OrdersByStatusChartProps) {
  const { data, isLoading } = useOrdersByStatusSeries(period);

  const points = data
    ? data.series.map((p) => ({
        label: formatSeriesKey(p.key, data.granularity),
        ...Object.fromEntries(ORDER_STATUSES.map((s) => [s, p.counts[s] ?? 0])),
      }))
    : [];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">PEDIDOS POR STATUS AO LONGO DO TEMPO</h2>
      {isLoading ? (
        <div className="flex h-72 items-center justify-center text-sm text-neutral-400">Carregando…</div>
      ) : points.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm text-neutral-400">Sem dados no período.</div>
      ) : (
        <ResponsiveContainer width="100%" height={288}>
          <BarChart data={points}>
            <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART_MUTED_TEXT }} axisLine={{ stroke: CHART_GRID_COLOR }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: CHART_MUTED_TEXT }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 12 }}
              formatter={(value, name) => [value, STATUS_LABELS[String(name)] ?? String(name)]}
            />
            <Legend
              formatter={(value: string) => <span className="text-xs text-neutral-600">{STATUS_LABELS[value] ?? value}</span>}
            />
            {ORDER_STATUSES.map((status) => (
              <Bar key={status} dataKey={status} stackId="status" fill={STATUS_COLORS[status]} maxBarSize={28} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
