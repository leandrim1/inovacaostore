import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRevenueSeries, type RevenueSeriesPoint } from "../../../hooks/admin/useAdminAnalytics";
import { formatSeriesKey, type PeriodFilter } from "../../../lib/dateRanges";
import { formatBRL } from "../../../lib/format";
import { CHART_GRID_COLOR, CHART_MUTED_TEXT, METRIC_COLORS } from "./chartColors";

type Metric = "revenue" | "profit" | "orders";

const METRIC_LABELS: Record<Metric, string> = {
  revenue: "Faturamento",
  profit: "Lucro",
  orders: "Pedidos",
};

const METRIC_DATA_KEY: Record<Metric, keyof RevenueSeriesPoint> = {
  revenue: "revenue",
  profit: "netProfit",
  orders: "orderCount",
};

function formatCompactBRL(value: number) {
  if (Math.abs(value) >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return formatBRL(value);
}

interface ChartPoint extends RevenueSeriesPoint {
  label: string;
}

function RevenueTrendTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: ChartPoint }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-brand-ink">{label}</p>
      <p className="text-neutral-600">Faturamento: {formatBRL(point.revenue)}</p>
      <p className="text-neutral-600">Lucro: {formatBRL(point.netProfit)}</p>
      <p className="text-neutral-600">Pedidos: {point.orderCount}</p>
      <p className="text-neutral-600">Ticket médio: {formatBRL(point.aov)}</p>
    </div>
  );
}

interface RevenueTrendChartProps {
  period: PeriodFilter;
}

export function RevenueTrendChart({ period }: RevenueTrendChartProps) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const { data, isLoading } = useRevenueSeries(period);

  const points: ChartPoint[] = data ? data.series.map((p) => ({ ...p, label: formatSeriesKey(p.key, data.granularity) })) : [];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm tracking-widest text-neutral-500">EVOLUÇÃO DE VENDAS</h2>
        <div className="flex gap-1 rounded-full bg-neutral-100 p-1">
          {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                metric === m ? "bg-white shadow-sm" : "text-neutral-500"
              }`}
              style={metric === m ? { color: METRIC_COLORS[m] } : undefined}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-72 items-center justify-center text-sm text-neutral-400">Carregando…</div>
      ) : points.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm text-neutral-400">Sem dados no período.</div>
      ) : (
        <ResponsiveContainer width="100%" height={288}>
          <AreaChart data={points}>
            <defs>
              <linearGradient id="revenueTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={METRIC_COLORS[metric]} stopOpacity={0.18} />
                <stop offset="100%" stopColor={METRIC_COLORS[metric]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: CHART_MUTED_TEXT }}
              axisLine={{ stroke: CHART_GRID_COLOR }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: CHART_MUTED_TEXT }}
              axisLine={false}
              tickLine={false}
              width={metric === "orders" ? 36 : 68}
              tickFormatter={(v: number) => (metric === "orders" ? String(v) : formatCompactBRL(v))}
            />
            <Tooltip content={<RevenueTrendTooltip />} />
            <Area
              type="monotone"
              dataKey={METRIC_DATA_KEY[metric]}
              stroke={METRIC_COLORS[metric]}
              strokeWidth={2}
              fill="url(#revenueTrendFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
