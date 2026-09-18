import { Router, type Request } from "express";
import { HttpError } from "../../errors.js";
import {
  PERIOD_PRESETS,
  pickGranularity,
  resolvePeriod,
  resolvePreviousPeriod,
  type PeriodRequest,
} from "../../dateRanges.js";
import { getSalesRules } from "../../analytics/rules.js";
import { getCustomerBreakdown, getKpiSummary } from "../../analytics/kpis.js";
import { getBestDays, getOrdersByStatusSeries, getRevenueSeries } from "../../analytics/series.js";
import { getProductRankings, type ProductSortBy } from "../../analytics/products.js";
import { getPaymentMethodBreakdown } from "../../analytics/payments.js";
import { getStatusBreakdown } from "../../analytics/statusBreakdown.js";
import { getShippingAnalysis } from "../../analytics/shipping.js";
import { getRegionBreakdown, type RegionGroupBy } from "../../analytics/regions.js";
import { getHourlyPattern } from "../../analytics/hourly.js";

export const adminAnalyticsRouter = Router();

function parsePeriodQuery(req: Request): PeriodRequest {
  const { preset, from, to } = req.query;
  if (typeof preset !== "string" || !(PERIOD_PRESETS as readonly string[]).includes(preset)) {
    throw new HttpError(400, "Período inválido.");
  }
  return {
    preset: preset as PeriodRequest["preset"],
    from: typeof from === "string" ? from : undefined,
    to: typeof to === "string" ? to : undefined,
  };
}

function parseLimit(value: unknown, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}

adminAnalyticsRouter.get("/summary", async (req, res) => {
  const periodReq = parsePeriodQuery(req);
  const range = resolvePeriod(periodReq);
  const previousRange = resolvePreviousPeriod(periodReq);
  const rules = await getSalesRules();

  const [summary, customers] = await Promise.all([
    getKpiSummary(range, previousRange, rules),
    getCustomerBreakdown(range, rules),
  ]);

  res.json({ range, previousRange, ...summary, customers });
});

adminAnalyticsRouter.get("/revenue-series", async (req, res) => {
  const periodReq = parsePeriodQuery(req);
  const range = resolvePeriod(periodReq);
  const granularity = pickGranularity(periodReq, range);
  const rules = await getSalesRules();

  const series = await getRevenueSeries(range, rules, granularity);
  res.json({ range, granularity, series });
});

adminAnalyticsRouter.get("/orders-by-status", async (req, res) => {
  const periodReq = parsePeriodQuery(req);
  const range = resolvePeriod(periodReq);
  const granularity = pickGranularity(periodReq, range);

  const series = await getOrdersByStatusSeries(range, granularity);
  res.json({ range, granularity, series });
});

adminAnalyticsRouter.get("/status-breakdown", async (req, res) => {
  const periodReq = parsePeriodQuery(req);
  const range = resolvePeriod(periodReq);

  const items = await getStatusBreakdown(range);
  res.json({ range, items });
});

const PRODUCT_SORT_OPTIONS: ProductSortBy[] = ["quantity", "revenue", "profit", "margin"];

adminAnalyticsRouter.get("/products", async (req, res) => {
  const periodReq = parsePeriodQuery(req);
  const range = resolvePeriod(periodReq);
  const rules = await getSalesRules();

  const sortByRaw = typeof req.query.sortBy === "string" ? req.query.sortBy : "quantity";
  if (!PRODUCT_SORT_OPTIONS.includes(sortByRaw as ProductSortBy)) {
    throw new HttpError(400, "Parâmetro sortBy inválido.");
  }
  const limit = parseLimit(req.query.limit, 20, 100);

  const items = await getProductRankings(range, rules, sortByRaw as ProductSortBy, limit);
  res.json({ range, items });
});

adminAnalyticsRouter.get("/payment-methods", async (req, res) => {
  const periodReq = parsePeriodQuery(req);
  const range = resolvePeriod(periodReq);
  const rules = await getSalesRules();

  const items = await getPaymentMethodBreakdown(range, rules);
  res.json({ range, items });
});

adminAnalyticsRouter.get("/shipping", async (req, res) => {
  const periodReq = parsePeriodQuery(req);
  const range = resolvePeriod(periodReq);
  const rules = await getSalesRules();

  const analysis = await getShippingAnalysis(range, rules);
  res.json({ range, ...analysis });
});

const REGION_GROUP_OPTIONS: RegionGroupBy[] = ["state", "city", "macro"];

adminAnalyticsRouter.get("/regions", async (req, res) => {
  const periodReq = parsePeriodQuery(req);
  const range = resolvePeriod(periodReq);
  const rules = await getSalesRules();

  const groupByRaw = typeof req.query.groupBy === "string" ? req.query.groupBy : "state";
  if (!REGION_GROUP_OPTIONS.includes(groupByRaw as RegionGroupBy)) {
    throw new HttpError(400, "Parâmetro groupBy inválido.");
  }

  const items = await getRegionBreakdown(range, rules, groupByRaw as RegionGroupBy);
  res.json({ range, items });
});

adminAnalyticsRouter.get("/hourly", async (req, res) => {
  const periodReq = parsePeriodQuery(req);
  const range = resolvePeriod(periodReq);
  const rules = await getSalesRules();

  const items = await getHourlyPattern(range, rules);
  res.json({ range, items });
});

adminAnalyticsRouter.get("/best-days", async (req, res) => {
  const periodReq = parsePeriodQuery(req);
  const range = resolvePeriod(periodReq);
  const rules = await getSalesRules();
  const limit = parseLimit(req.query.limit, 10, 100);

  const items = await getBestDays(range, rules, limit);
  res.json({ range, items });
});
