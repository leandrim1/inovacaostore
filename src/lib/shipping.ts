import { api } from "./api";

export interface ShippingItemInput {
  variantId: string;
  quantity: number;
}

export interface ShippingQuote {
  price: number;
  distanceKm: number | null;
  distanceMethod: "linha reta (aproximada)" | null;
  isFree: boolean;
  tierLabel: string | null;
  etaLabel: string | null;
  method: "distancia" | "gratis-valor" | "gratis-regiao" | "fallback" | "desativado";
}

const CEP_PATTERN = /^\d{5}-?\d{3}$/;

export function isValidCep(cep: string) {
  return CEP_PATTERN.test(cep.trim());
}

export function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function quoteShipping(cep: string, items: ShippingItemInput[]) {
  return api.post<ShippingQuote>("/api/shipping/quote", { cep, items });
}
