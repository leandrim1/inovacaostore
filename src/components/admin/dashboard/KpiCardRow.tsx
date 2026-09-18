import { ArrowDown, ArrowUp, DollarSign, Package, ShoppingCart, TrendingUp, Users, Wallet } from "lucide-react";
import { formatBRL, formatSignedPct } from "../../../lib/format";
import type { KpiSummary } from "../../../hooks/admin/useAdminAnalytics";

interface KpiCardRowProps {
  summary: KpiSummary | undefined;
  isLoading: boolean;
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct == null) {
    return <span className="text-xs text-neutral-400">sem período anterior para comparar</span>;
  }
  const isUp = pct > 0;
  const isFlat = pct === 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isFlat ? "text-neutral-400" : isUp ? "text-green-700" : "text-red-600"
      }`}
    >
      {!isFlat && (isUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      {formatSignedPct(pct)} em relação ao período anterior
    </span>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  delta,
  sub,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  delta?: number | null;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cream text-brand-ink">
          <Icon size={18} />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      </div>
      <p className="font-display text-2xl text-brand-ink">{value}</p>
      {sub && <p className="-mt-2 text-xs text-neutral-500">{sub}</p>}
      {delta !== undefined && <DeltaBadge pct={delta} />}
    </div>
  );
}

export function KpiCardRow({ summary, isLoading }: KpiCardRowProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[112px] animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-black/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card icon={DollarSign} label="Faturamento" value={formatBRL(summary.revenue)} delta={summary.revenueChangePct} />
      <Card
        icon={Wallet}
        label="Lucro líquido"
        value={formatBRL(summary.netProfit)}
        delta={summary.netProfitChangePct}
        sub={summary.marginPct != null ? `Margem: ${summary.marginPct.toFixed(1)}%` : "Margem indisponível"}
      />
      <Card icon={ShoppingCart} label="Pedidos" value={String(summary.orderCount)} delta={summary.orderCountChangePct} />
      <Card icon={TrendingUp} label="Ticket médio" value={formatBRL(summary.aov)} delta={summary.aovChangePct} />
      <Card
        icon={Package}
        label="Produtos vendidos"
        value={`${summary.unitsSold} unidade(s)`}
        delta={summary.unitsSoldChangePct}
      />
      <Card
        icon={Users}
        label="Clientes"
        value={String(summary.customers.totalCustomers)}
        sub={`${summary.customers.newCustomers} novo(s) · ${summary.customers.returningCustomers} recorrente(s)`}
      />
    </div>
  );
}
