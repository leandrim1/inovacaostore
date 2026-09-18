import { Truck } from "lucide-react";
import { useShippingAnalysis } from "../../../hooks/admin/useAdminAnalytics";
import type { PeriodFilter } from "../../../lib/dateRanges";
import { formatBRL } from "../../../lib/format";

interface ShippingAnalysisPanelProps {
  period: PeriodFilter;
}

export function ShippingAnalysisPanel({ period }: ShippingAnalysisPanelProps) {
  const { data, isLoading } = useShippingAnalysis(period);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-sm tracking-widest text-neutral-500">
        <Truck size={16} /> ANÁLISE DE FRETE
      </h2>
      {isLoading || !data ? (
        <p className="py-8 text-center text-sm text-neutral-400">Carregando…</p>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Frete cobrado dos clientes</span>
            <span className="font-medium text-brand-ink">{formatBRL(data.totalChargedToCustomers)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Custo das entregas</span>
            <span className="font-medium text-brand-ink">{formatBRL(data.totalCostToStore)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-black/10 pt-2">
            <span className="text-neutral-500">Resultado com frete</span>
            <span className={`font-display text-lg ${data.difference >= 0 ? "text-green-700" : "text-red-600"}`}>
              {data.difference >= 0 ? "+ " : "- "}
              {formatBRL(Math.abs(data.difference))}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-black/10 pt-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-neutral-400">Pedidos entregues</p>
              <p className="font-medium text-brand-ink">{data.deliveredOrderCount}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Custo médio de entrega</p>
              <p className="font-medium text-brand-ink">{formatBRL(data.avgCostPerOrder)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Frete médio por pedido</p>
              <p className="font-medium text-brand-ink">{formatBRL(data.avgPricePerOrder)}</p>
            </div>
          </div>
          {data.hasEstimatedCosts && (
            <p className="mt-2 text-xs text-neutral-400">
              * Custo de frete estimado para pedidos sem correspondência exata na tabela de faixas atual.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
