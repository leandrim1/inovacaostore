import { useQuery } from "@tanstack/react-query";
import { api, buildQueryString } from "../../lib/api";
import type { PeriodFilter } from "../../lib/dateRanges";

interface PeriodRangeDto {
  from: string;
  to: string;
}

function periodParams(period: PeriodFilter) {
  return { preset: period.preset, from: period.from, to: period.to };
}

export interface CostBreakdown {
  productCost: number;
  shippingCost: number;
  paymentFees: number;
  platformFees: number;
  otherExpenses: number;
  discountTotal: number;
}

export interface KpiSummary {
  range: PeriodRangeDto;
  previousRange: PeriodRangeDto;
  revenue: number;
  previousRevenue: number;
  revenueChangePct: number | null;
  netProfit: number;
  previousNetProfit: number;
  netProfitChangePct: number | null;
  marginPct: number | null;
  orderCount: number;
  previousOrderCount: number;
  orderCountChangePct: number | null;
  aov: number;
  previousAov: number;
  aovChangePct: number | null;
  unitsSold: number;
  previousUnitsSold: number;
  unitsSoldChangePct: number | null;
  costBreakdown: CostBreakdown;
  hasEstimatedCosts: boolean;
  customers: { newCustomers: number; returningCustomers: number; totalCustomers: number };
}

export function useAnalyticsSummary(period: PeriodFilter) {
  const qs = buildQueryString(periodParams(period));
  return useQuery({
    queryKey: ["admin-analytics", "summary", period],
    queryFn: () => api.get<KpiSummary>(`/api/admin/analytics/summary${qs}`),
  });
}

export interface RevenueSeriesPoint {
  key: string;
  date: string;
  revenue: number;
  netProfit: number;
  orderCount: number;
  aov: number;
}

export type Granularity = "hour" | "day" | "month";

export function useRevenueSeries(period: PeriodFilter) {
  const qs = buildQueryString(periodParams(period));
  return useQuery({
    queryKey: ["admin-analytics", "revenue-series", period],
    queryFn: () =>
      api.get<{ range: PeriodRangeDto; granularity: Granularity; series: RevenueSeriesPoint[] }>(
        `/api/admin/analytics/revenue-series${qs}`,
      ),
  });
}

export interface OrdersByStatusPoint {
  key: string;
  date: string;
  counts: Record<string, number>;
}

export function useOrdersByStatusSeries(period: PeriodFilter) {
  const qs = buildQueryString(periodParams(period));
  return useQuery({
    queryKey: ["admin-analytics", "orders-by-status", period],
    queryFn: () =>
      api.get<{ range: PeriodRangeDto; granularity: Granularity; series: OrdersByStatusPoint[] }>(
        `/api/admin/analytics/orders-by-status${qs}`,
      ),
  });
}

export interface StatusBreakdownItem {
  status: string;
  orderCount: number;
}

export function useStatusBreakdown(period: PeriodFilter) {
  const qs = buildQueryString(periodParams(period));
  return useQuery({
    queryKey: ["admin-analytics", "status-breakdown", period],
    queryFn: () => api.get<{ range: PeriodRangeDto; items: StatusBreakdownItem[] }>(`/api/admin/analytics/status-breakdown${qs}`),
  });
}

export type ProductSortBy = "quantity" | "revenue" | "profit" | "margin";

export interface ProductRanking {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number | null;
}

export function useProductRankings(period: PeriodFilter, sortBy: ProductSortBy, limit = 20) {
  const qs = buildQueryString({ ...periodParams(period), sortBy, limit });
  return useQuery({
    queryKey: ["admin-analytics", "products", period, sortBy, limit],
    queryFn: () => api.get<{ range: PeriodRangeDto; items: ProductRanking[] }>(`/api/admin/analytics/products${qs}`),
  });
}

export interface PaymentMethodBreakdownItem {
  method: string;
  orderCount: number;
  revenue: number;
}

export function usePaymentMethodBreakdown(period: PeriodFilter) {
  const qs = buildQueryString(periodParams(period));
  return useQuery({
    queryKey: ["admin-analytics", "payment-methods", period],
    queryFn: () =>
      api.get<{ range: PeriodRangeDto; items: PaymentMethodBreakdownItem[] }>(`/api/admin/analytics/payment-methods${qs}`),
  });
}

export interface ShippingAnalysis {
  range: PeriodRangeDto;
  totalChargedToCustomers: number;
  totalCostToStore: number;
  difference: number;
  deliveredOrderCount: number;
  avgCostPerOrder: number;
  avgPricePerOrder: number;
  hasEstimatedCosts: boolean;
}

export function useShippingAnalysis(period: PeriodFilter) {
  const qs = buildQueryString(periodParams(period));
  return useQuery({
    queryKey: ["admin-analytics", "shipping", period],
    queryFn: () => api.get<ShippingAnalysis>(`/api/admin/analytics/shipping${qs}`),
  });
}

export type RegionGroupBy = "state" | "city" | "macro";

export interface RegionBreakdownItem {
  key: string;
  orderCount: number;
  revenue: number;
  aov: number;
  profit: number;
}

export function useRegionBreakdown(period: PeriodFilter, groupBy: RegionGroupBy) {
  const qs = buildQueryString({ ...periodParams(period), groupBy });
  return useQuery({
    queryKey: ["admin-analytics", "regions", period, groupBy],
    queryFn: () => api.get<{ range: PeriodRangeDto; items: RegionBreakdownItem[] }>(`/api/admin/analytics/regions${qs}`),
  });
}

export interface HourlyPatternItem {
  hour: number;
  orderCount: number;
  revenue: number;
}

export function useHourlyPattern(period: PeriodFilter) {
  const qs = buildQueryString(periodParams(period));
  return useQuery({
    queryKey: ["admin-analytics", "hourly", period],
    queryFn: () => api.get<{ range: PeriodRangeDto; items: HourlyPatternItem[] }>(`/api/admin/analytics/hourly${qs}`),
  });
}

export interface BestDayItem {
  date: string;
  orderCount: number;
  revenue: number;
  netProfit: number;
}

export function useBestDays(period: PeriodFilter, limit = 10) {
  const qs = buildQueryString({ ...periodParams(period), limit });
  return useQuery({
    queryKey: ["admin-analytics", "best-days", period, limit],
    queryFn: () => api.get<{ range: PeriodRangeDto; items: BestDayItem[] }>(`/api/admin/analytics/best-days${qs}`),
  });
}
