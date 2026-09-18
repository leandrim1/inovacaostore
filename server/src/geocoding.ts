import { prisma } from "./db.js";

export interface GeocodeCoords {
  lat: number;
  lng: number;
  city: string;
  state: string;
  source: string;
}

export type GeocodeResult =
  | ({ ok: true } & GeocodeCoords)
  | { ok: false; reason: "not_found" | "service_unavailable" };

const FETCH_TIMEOUT_MS = 6000;
const NOMINATIM_USER_AGENT = "InovacaoStoreShipping/1.0 (contato via site)";

function normalizeCep(cep: string) {
  return cep.replace(/\D/g, "");
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/** BrasilAPI CEP v2 já traz coordenadas (quando disponíveis) direto do CEP,
 * sem precisar de um segundo passo de geocodificação. */
interface BrasilApiCepResponse {
  city?: string;
  state?: string;
  location?: { coordinates?: { latitude?: string | number; longitude?: string | number } };
}

async function tryBrasilApi(cep: string): Promise<GeocodeCoords | "not_found" | null> {
  try {
    const res = await fetchWithTimeout(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (res.status === 404) return "not_found";
    if (!res.ok) return null;
    const data = (await res.json()) as BrasilApiCepResponse;
    const lat = Number(data?.location?.coordinates?.latitude);
    const lng = Number(data?.location?.coordinates?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      return null;
    }
    return {
      lat,
      lng,
      city: String(data.city ?? ""),
      state: String(data.state ?? ""),
      source: "brasilapi",
    };
  } catch {
    return null;
  }
}

interface ViaCepAddress {
  city: string;
  state: string;
  street: string;
  neighborhood: string;
}

interface ViaCepResponse {
  erro?: boolean;
  localidade?: string;
  uf?: string;
  logradouro?: string;
  bairro?: string;
}

async function tryViaCep(cep: string): Promise<ViaCepAddress | "not_found" | null> {
  try {
    const res = await fetchWithTimeout(`https://viacep.com.br/ws/${cep}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCepResponse;
    if (data?.erro) return "not_found";
    return {
      city: String(data.localidade ?? ""),
      state: String(data.uf ?? ""),
      street: String(data.logradouro ?? ""),
      neighborhood: String(data.bairro ?? ""),
    };
  } catch {
    return null;
  }
}

/** Geocodifica um endereço textual via Nominatim (OpenStreetMap), restrito
 * ao Brasil. Usado só quando o CEP existe mas a BrasilAPI não trouxe
 * coordenadas — respeita a política do serviço (User-Agent + 1 req/vez). */
interface NominatimResult {
  lat?: string;
  lon?: string;
}

async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
    if (!res.ok) return null;
    const results = (await res.json()) as NominatimResult[];
    const first = Array.isArray(results) ? results[0] : null;
    if (!first) return null;
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

async function readCache(cep: string): Promise<GeocodeCoords | null> {
  const cached = await prisma.cepGeocodeCache.findUnique({ where: { cep } }).catch(() => null);
  if (!cached) return null;
  return { lat: cached.lat, lng: cached.lng, city: cached.city, state: cached.state, source: cached.source };
}

async function writeCache(cep: string, coords: GeocodeCoords) {
  await prisma.cepGeocodeCache
    .upsert({
      where: { cep },
      update: coords,
      create: { cep, ...coords },
    })
    .catch(() => undefined); // cache é otimização, nunca deve derrubar a cotação de frete
}

/**
 * Resolve um CEP brasileiro em coordenadas geográficas.
 * Ordem: cache -> BrasilAPI (já traz lat/lng do CEP) -> ViaCEP (endereço)
 * + Nominatim (geocodifica o endereço) -> geocodifica só cidade/UF como
 * último recurso antes de desistir.
 */
export async function geocodeCep(rawCep: string): Promise<GeocodeResult> {
  const cep = normalizeCep(rawCep);
  if (cep.length !== 8) return { ok: false, reason: "not_found" };

  const cached = await readCache(cep);
  if (cached) return { ok: true, ...cached };

  const brasilApiResult = await tryBrasilApi(cep);
  if (brasilApiResult && brasilApiResult !== "not_found") {
    await writeCache(cep, brasilApiResult);
    return { ok: true, ...brasilApiResult };
  }

  const viaCep = await tryViaCep(cep);
  if (viaCep === "not_found" && brasilApiResult === "not_found") {
    return { ok: false, reason: "not_found" };
  }
  if (!viaCep) {
    // Nem BrasilAPI nem ViaCEP responderam de forma utilizável — trata como
    // indisponibilidade do serviço, não como CEP inexistente.
    return { ok: false, reason: brasilApiResult === "not_found" ? "not_found" : "service_unavailable" };
  }
  if (viaCep === "not_found") {
    return { ok: false, reason: "not_found" };
  }

  const fullAddressQuery = `${viaCep.street}, ${viaCep.neighborhood}, ${viaCep.city} - ${viaCep.state}, Brasil`;
  let coords = await geocodeAddress(fullAddressQuery);
  if (!coords) {
    // Sem o logradouro exato, tenta só cidade/UF (menos preciso, mas evita
    // falhar a cotação inteira por causa de um endereço muito específico).
    coords = await geocodeAddress(`${viaCep.city} - ${viaCep.state}, Brasil`);
  }
  if (!coords) {
    return { ok: false, reason: "service_unavailable" };
  }

  const result: GeocodeCoords = {
    lat: coords.lat,
    lng: coords.lng,
    city: viaCep.city,
    state: viaCep.state,
    source: "viacep+nominatim",
  };
  await writeCache(cep, result);
  return { ok: true, ...result };
}
