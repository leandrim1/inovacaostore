import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useHourlyPattern, type HourlyPatternItem } from "../../../hooks/admin/useAdminAnalytics";
import type { PeriodFilter } from "../../../lib/dateRanges";
import { formatBRL } from "../../../lib/format";
import { CHART_GRID_COLOR, CHART_MUTED_TEXT, METRIC_COLORS } from "./chartColors";

function HourTooltip({ active, payload }: { active?: boolean; payload?: { payload: HourlyPatternItem }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1 font-medium text-brand-ink">{String(point.hour).padStart(2, "0")}h</p>
      <p className="text-neutral-600">{point.orderCount} pedido(s)</p>
      <p className="text-neutral-600">{formatBRL(point.revenue)}</p>
    </div>
  );
}

interface HourlyPatternChartProps {
  period: PeriodFilter;
}

export function HourlyPatternChart({ period }: HourlyPatternChartProps) {
  const { data, isLoading } = useHourlyPattern(period);
  const items = data?.items ?? [];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">HORÁRIOS DE MAIOR VENDA</h2>
      {isLoading ? (
        <div className="flex h-56 items-center justify-center text-sm text-neutral-400">Carregando…</div>
      ) : items.every((i) => i.orderCount === 0) ? (
        <div className="flex h-56 items-center justify-center text-sm text-neutral-400">Sem dados no período.</div>
      ) : (
        <ResponsiveContainer width="100%" height={224}>
          <BarChart data={items}>
            <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="hour"
              tickFormatter={(h: number) => `${h}h`}
              tick={{ fontSize: 11, fill: CHART_MUTED_TEXT }}
              axisLine={{ stroke: CHART_GRID_COLOR }}
              tickLine={false}
              interval={1}
            />
            <YAxis tick={{ fontSize: 12, fill: CHART_MUTED_TEXT }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip content={<HourTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="orderCount" fill={METRIC_COLORS.revenue} radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
