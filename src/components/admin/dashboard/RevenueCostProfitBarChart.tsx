import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { KpiSummary } from "../../../hooks/admin/useAdminAnalytics";
import { formatBRL } from "../../../lib/format";
import { CHART_GRID_COLOR, CHART_MUTED_TEXT, COSTS_COLOR, METRIC_COLORS } from "./chartColors";

interface RevenueCostProfitBarChartProps {
  summary: KpiSummary | undefined;
  isLoading: boolean;
}

function BarTooltip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number } }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3 text-xs shadow-lg">
      <p className="font-medium text-brand-ink">{point.name}</p>
      <p className="text-neutral-600">{formatBRL(point.value)}</p>
    </div>
  );
}

export function RevenueCostProfitBarChart({ summary, isLoading }: RevenueCostProfitBarChartProps) {
  const totalCosts = summary
    ? summary.costBreakdown.productCost +
      summary.costBreakdown.shippingCost +
      summary.costBreakdown.paymentFees +
      summary.costBreakdown.platformFees +
      summary.costBreakdown.otherExpenses
    : 0;

  const data = summary
    ? [
        { name: "Faturamento", value: summary.revenue, color: METRIC_COLORS.revenue },
        { name: "Custos", value: totalCosts, color: COSTS_COLOR },
        { name: "Lucro", value: summary.netProfit, color: METRIC_COLORS.profit },
      ]
    : [];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">FATURAMENTO x CUSTOS x LUCRO</h2>
      {isLoading || !summary ? (
        <div className="flex h-56 items-center justify-center text-sm text-neutral-400">Carregando…</div>
      ) : (
        <ResponsiveContainer width="100%" height={224}>
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid stroke={CHART_GRID_COLOR} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: CHART_MUTED_TEXT }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatBRL(v)}
            />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: CHART_MUTED_TEXT }} axisLine={false} tickLine={false} width={90} />
            <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={32}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      {summary?.hasEstimatedCosts && (
        <p className="mt-3 text-xs text-neutral-400">
          * Alguns custos deste período foram estimados a partir dos valores atuais de produto/frete (pedidos sem custo
          registrado na época da compra).
        </p>
      )}
    </div>
  );
}
