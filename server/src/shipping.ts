import { prisma } from "./db.js";
import { geocodeCep } from "./geocoding.js";
import { haversineKm } from "./distance.js";

const CEP_PATTERN = /^\d{5}-?\d{3}$/;

export function isValidCep(cep: string) {
  return CEP_PATTERN.test(cep.trim());
}

export interface ShippingItemInput {
  variantId: string;
  quantity: number;
}

export interface ShippingQuoteResult {
  price: number;
  distanceKm: number | null;
  distanceMethod: "linha reta (aproximada)" | null;
  isFree: boolean;
  tierLabel: string | null;
  etaLabel: string | null;
  method: "distancia" | "gratis-valor" | "gratis-regiao" | "fallback" | "desativado";
}

export type ShippingCalcOutcome =
  | { ok: true; quote: ShippingQuoteResult }
  | { ok: false; reason: "invalid_cep" | "cep_not_found" | "service_unavailable" | "no_coverage" | "no_items" };

interface FreeRegion {
  state: string;
  city?: string;
}

function parseFreeRegions(json: string): FreeRegion[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r): r is FreeRegion => r && typeof r.state === "string");
  } catch {
    return [];
  }
}

function matchesFreeRegion(regions: FreeRegion[], city: string, state: string) {
  const normalize = (s: string) => s.trim().toLowerCase();
  return regions.some((r) => {
    if (normalize(r.state) !== normalize(state)) return false;
    if (!r.city) return true; // estado inteiro liberado
    return normalize(r.city) === normalize(city);
  });
}

async function loadCartTotals(items: ShippingItemInput[]) {
  if (items.length === 0) return null;
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: items.map((i) => i.variantId) } },
    include: { product: true },
  });

  let subtotal = 0;
  let totalWeightKg = 0;
  let totalVolumeM3 = 0;
  for (const item of items) {
    const variant = variants.find((v) => v.id === item.variantId);
    if (!variant) continue;
    subtotal += variant.product.price * item.quantity;
    totalWeightKg += variant.product.weightKg * item.quantity;
    totalVolumeM3 += variant.product.volumeM3 * item.quantity;
  }
  return { subtotal, totalWeightKg, totalVolumeM3 };
}

async function getSettings() {
  const settings = await prisma.shippingSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    throw new Error("Configurações de frete não inicializadas.");
  }
  return settings;
}

function surcharge(total: number, freeUpTo: number, pricePerExtra: number) {
  const extra = Math.max(0, total - freeUpTo);
  return extra * pricePerExtra;
}

function roundKm(km: number) {
  return Math.round(km * 10) / 10;
}

/**
 * Calcula o frete para um CEP + itens do carrinho/pedido. Usada tanto na
 * cotação (carrinho/checkout) quanto na criação do pedido — o preço final
 * é sempre recalculado aqui no servidor, nunca aceito do cliente.
 */
export async function calculateShipping({
  cep,
  items,
}: {
  cep: string;
  items: ShippingItemInput[];
}): Promise<ShippingCalcOutcome> {
  if (!isValidCep(cep)) return { ok: false, reason: "invalid_cep" };
  if (items.length === 0) return { ok: false, reason: "no_items" };

  const settings = await getSettings();
  const totals = await loadCartTotals(items);
  if (!totals) return { ok: false, reason: "no_items" };

  const freeByValue =
    settings.freeShippingMinOrderValue != null && totals.subtotal >= settings.freeShippingMinOrderValue;

  if (!settings.enabled) {
    if (freeByValue) {
      return {
        ok: true,
        quote: {
          price: 0,
          distanceKm: null,
          distanceMethod: null,
          isFree: true,
          tierLabel: null,
          etaLabel: null,
          method: "gratis-valor",
        },
      };
    }
    return {
      ok: true,
      quote: {
        price: settings.fallbackFlatPrice,
        distanceKm: null,
        distanceMethod: null,
        isFree: settings.fallbackFlatPrice === 0,
        tierLabel: null,
        etaLabel: null,
        method: "fallback",
      },
    };
  }

  if (freeByValue) {
    // Frete grátis por valor não depende de geocodificação — não deixa a
    // cotação falhar por causa de um problema na API externa aqui.
    const geo = await geocodeCep(cep);
    return {
      ok: true,
      quote: {
        price: 0,
        distanceKm: geo.ok ? roundKm(haversineKm({ lat: settings.originLat, lng: settings.originLng }, geo)) : null,
        distanceMethod: geo.ok ? "linha reta (aproximada)" : null,
        isFree: true,
        tierLabel: null,
        etaLabel: null,
        method: "gratis-valor",
      },
    };
  }

  const geo = await geocodeCep(cep);
  if (!geo.ok) {
    return { ok: false, reason: geo.reason === "not_found" ? "cep_not_found" : "service_unavailable" };
  }

  const freeRegions = parseFreeRegions(settings.freeShippingRegions);
  if (matchesFreeRegion(freeRegions, geo.city, geo.state)) {
    const distanceKm = roundKm(haversineKm({ lat: settings.originLat, lng: settings.originLng }, geo));
    return {
      ok: true,
      quote: {
        price: 0,
        distanceKm,
        distanceMethod: "linha reta (aproximada)",
        isFree: true,
        tierLabel: null,
        etaLabel: null,
        method: "gratis-regiao",
      },
    };
  }

  const distanceKm = haversineKm({ lat: settings.originLat, lng: settings.originLng }, geo);

  const tiers = await prisma.shippingTier.findMany({ orderBy: { minKm: "asc" } });
  const tier = tiers.find((t) => distanceKm >= t.minKm && (t.maxKm === null || distanceKm < t.maxKm));
  if (!tier) return { ok: false, reason: "no_coverage" };

  const weightExtra = surcharge(totals.totalWeightKg, settings.freeWeightKg, settings.pricePerExtraKg);
  const volumeExtra = surcharge(totals.totalVolumeM3, settings.freeVolumeM3, settings.pricePerExtraM3);
  const price = Math.max(tier.price + weightExtra + volumeExtra, settings.minShippingPrice);

  const tierLabel =
    tier.maxKm === null
      ? `Acima de ${tier.minKm.toFixed(0)} km`
      : `${tier.minKm.toFixed(0)} a ${tier.maxKm.toFixed(0)} km`;

  return {
    ok: true,
    quote: {
      price: Math.round(price * 100) / 100,
      distanceKm: roundKm(distanceKm),
      distanceMethod: "linha reta (aproximada)",
      isFree: false,
      tierLabel,
      etaLabel: tier.etaLabel,
      method: "distancia",
    },
  };
}
