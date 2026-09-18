import { Download, Printer } from "lucide-react";
import { useAnalyticsSummary, useProductRankings, useRevenueSeries } from "../../../hooks/admin/useAdminAnalytics";
import { formatSeriesKey, type PeriodFilter } from "../../../lib/dateRanges";
import { csvNumber, downloadMultiSectionCsv } from "../../../lib/exportCsv";

interface ExportBarProps {
  period: PeriodFilter;
}

export function ExportBar({ period }: ExportBarProps) {
  const { data: summary } = useAnalyticsSummary(period);
  const { data: revenueSeries } = useRevenueSeries(period);
  const { data: products } = useProductRankings(period, "revenue", 50);

  function handleExportCsv() {
    if (!summary) return;

    downloadMultiSectionCsv(`relatorio-vendas-${period.preset}.csv`, [
      {
        title: "Resumo do período",
        rows: [
          { indicador: "Faturamento", valor: csvNumber(summary.revenue) },
          { indicador: "Lucro líquido", valor: csvNumber(summary.netProfit) },
          { indicador: "Margem (%)", valor: summary.marginPct != null ? csvNumber(summary.marginPct, 1) : "" },
          { indicador: "Total de pedidos", valor: summary.orderCount },
          { indicador: "Ticket médio", valor: csvNumber(summary.aov) },
          { indicador: "Produtos vendidos", valor: summary.unitsSold },
          { indicador: "Clientes novos", valor: summary.customers.newCustomers },
          { indicador: "Clientes recorrentes", valor: summary.customers.returningCustomers },
        ],
      },
      {
        title: "Evolução de vendas",
        rows: (revenueSeries?.series ?? []).map((p) => ({
          data: formatSeriesKey(p.key, revenueSeries!.granularity),
          faturamento: csvNumber(p.revenue),
          lucro: csvNumber(p.netProfit),
          pedidos: p.orderCount,
          ticketMedio: csvNumber(p.aov),
        })),
      },
      {
        title: "Produtos",
        rows: (products?.items ?? []).map((p) => ({
          produto: p.name,
          quantidade: p.quantitySold,
          faturamento: csvNumber(p.revenue),
          custo: csvNumber(p.cost),
          lucro: csvNumber(p.profit),
          margemPct: p.marginPct != null ? csvNumber(p.marginPct, 1) : "",
        })),
      },
    ]);
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleExportCsv}
        disabled={!summary}
        className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-brand-ink hover:border-brand-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={16} /> Exportar CSV
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-brand-ink hover:border-brand-ink"
      >
        <Printer size={16} /> Imprimir / Exportar PDF
      </button>
    </div>
  );
}
