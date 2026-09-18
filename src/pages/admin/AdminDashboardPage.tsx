import { useState } from "react";
import { useAnalyticsSummary } from "../../hooks/admin/useAdminAnalytics";
import { DEFAULT_PERIOD_FILTER, type PeriodFilter } from "../../lib/dateRanges";
import { PeriodPicker } from "../../components/admin/dashboard/PeriodPicker";
import { ExportBar } from "../../components/admin/dashboard/ExportBar";
import { KpiCardRow } from "../../components/admin/dashboard/KpiCardRow";
import { RevenueTrendChart } from "../../components/admin/dashboard/RevenueTrendChart";
import { RevenueCostProfitBarChart } from "../../components/admin/dashboard/RevenueCostProfitBarChart";
import { OrdersByStatusChart } from "../../components/admin/dashboard/OrdersByStatusChart";
import { TopProductsTable } from "../../components/admin/dashboard/TopProductsTable";
import { PaymentMethodsPanel } from "../../components/admin/dashboard/PaymentMethodsPanel";
import { StatusBreakdownPanel } from "../../components/admin/dashboard/StatusBreakdownPanel";
import { ShippingAnalysisPanel } from "../../components/admin/dashboard/ShippingAnalysisPanel";
import { RegionBreakdownPanel } from "../../components/admin/dashboard/RegionBreakdownPanel";
import { HourlyPatternChart } from "../../components/admin/dashboard/HourlyPatternChart";
import { BestDaysTable } from "../../components/admin/dashboard/BestDaysTable";

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<PeriodFilter>(DEFAULT_PERIOD_FILTER);
  const { data: summary, isLoading: isLoadingSummary } = useAnalyticsSummary(period);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-wide">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodPicker value={period} onChange={setPeriod} />
          <ExportBar period={period} />
        </div>
      </div>

      <KpiCardRow summary={summary} isLoading={isLoadingSummary} />

      <RevenueTrendChart period={period} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueCostProfitBarChart summary={summary} isLoading={isLoadingSummary} />
        <OrdersByStatusChart period={period} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopProductsTable period={period} title="Produtos mais vendidos" defaultSortBy="quantity" allowSortToggle />
        <TopProductsTable period={period} title="Produtos que mais geram lucro" defaultSortBy="profit" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PaymentMethodsPanel period={period} />
        <StatusBreakdownPanel period={period} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ShippingAnalysisPanel period={period} />
        <RegionBreakdownPanel period={period} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HourlyPatternChart period={period} />
        <BestDaysTable period={period} />
      </div>
    </div>
  );
}
