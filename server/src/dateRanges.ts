import { HttpError } from "./errors.js";

/**
 * Todo o cálculo de período deste arquivo assume horário de Brasília
 * (America/Sao_Paulo, UTC-3 fixo — o Brasil não tem mais horário de
 * verão desde 2019, então não há transições a considerar). Nunca usar
 * `Date.prototype.getHours()`/`getFullYear()` etc. em código de negócio:
 * eles leem o fuso do host (UTC em produção, mas pode ser outro em uma
 * máquina de desenvolvimento) — sempre passar pelo deslocamento fixo
 * abaixo e ler com os métodos `getUTC*`.
 */
const BR_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const PERIOD_PRESETS = [
  "hoje",
  "ontem",
  "ultimos-7-dias",
  "esta-semana",
  "semana-passada",
  "este-mes",
  "mes-passado",
  "ultimos-30-dias",
  "este-ano",
  "ano-passado",
  "personalizado",
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export interface PeriodRequest {
  preset: PeriodPreset;
  /** "AAAA-MM-DD", só para preset "personalizado" (inclusivo). */
  from?: string;
  /** "AAAA-MM-DD", só para preset "personalizado" (inclusivo). */
  to?: string;
}

export interface PeriodRange {
  /** Instante UTC real, inclusivo. */
  from: Date;
  /** Instante UTC real, EXCLUSIVO. */
  to: Date;
}

export type Granularity = "hour" | "day" | "month";

export class PeriodError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

interface BrParts {
  year: number;
  month: number; // 0-11
  day: number;
  hour: number;
}

export function toBrParts(instant: Date): BrParts {
  const shifted = new Date(instant.getTime() + BR_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
  };
}

/** Instante UTC real correspondente à meia-noite de (year, month, day) no horário de Brasília. */
function fromBrDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - BR_OFFSET_MS);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function brWeekday(instant: Date): number {
  // 0 = domingo … 6 = sábado, calculado sobre o instante já deslocado para BR.
  return new Date(instant.getTime() + BR_OFFSET_MS).getUTCDay();
}

function startOfBrWeek(instant: Date): Date {
  const parts = toBrParts(instant);
  const dayStart = fromBrDate(parts.year, parts.month, parts.day);
  const mondayIndex = (brWeekday(instant) + 6) % 7; // segunda-feira = 0
  return addDays(dayStart, -mondayIndex);
}

function nextMonthStart(year: number, month: number): Date {
  return month === 11 ? fromBrDate(year + 1, 0, 1) : fromBrDate(year, month + 1, 1);
}

function prevMonthParts(year: number, month: number): { year: number; month: number } {
  return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
}

function parseBrDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new PeriodError(`Data inválida: "${value}". Use o formato AAAA-MM-DD.`);
  const [, y, m, d] = match;
  return fromBrDate(Number(y), Number(m) - 1, Number(d));
}

/**
 * Resolve um preset de período (ou datas personalizadas) para um
 * intervalo de instantes UTC reais. `to` é sempre exclusivo.
 */
export function resolvePeriod(req: PeriodRequest, now: Date = new Date()): PeriodRange {
  const today = toBrParts(now);

  switch (req.preset) {
    case "hoje": {
      const from = fromBrDate(today.year, today.month, today.day);
      return { from, to: addDays(from, 1) };
    }
    case "ontem": {
      const todayStart = fromBrDate(today.year, today.month, today.day);
      return { from: addDays(todayStart, -1), to: todayStart };
    }
    case "ultimos-7-dias": {
      const to = addDays(fromBrDate(today.year, today.month, today.day), 1);
      return { from: addDays(to, -7), to };
    }
    case "ultimos-30-dias": {
      const to = addDays(fromBrDate(today.year, today.month, today.day), 1);
      return { from: addDays(to, -30), to };
    }
    case "esta-semana": {
      const from = startOfBrWeek(now);
      return { from, to: addDays(from, 7) };
    }
    case "semana-passada": {
      const thisWeekStart = startOfBrWeek(now);
      return { from: addDays(thisWeekStart, -7), to: thisWeekStart };
    }
    case "este-mes": {
      const from = fromBrDate(today.year, today.month, 1);
      return { from, to: nextMonthStart(today.year, today.month) };
    }
    case "mes-passado": {
      const thisMonthStart = fromBrDate(today.year, today.month, 1);
      const prev = prevMonthParts(today.year, today.month);
      return { from: fromBrDate(prev.year, prev.month, 1), to: thisMonthStart };
    }
    case "este-ano": {
      return { from: fromBrDate(today.year, 0, 1), to: fromBrDate(today.year + 1, 0, 1) };
    }
    case "ano-passado": {
      return { from: fromBrDate(today.year - 1, 0, 1), to: fromBrDate(today.year, 0, 1) };
    }
    case "personalizado": {
      if (!req.from || !req.to) {
        throw new PeriodError("Informe as datas inicial e final do período personalizado.");
      }
      const from = parseBrDateOnly(req.from);
      const to = addDays(parseBrDateOnly(req.to), 1);
      if (from.getTime() >= to.getTime()) {
        throw new PeriodError("A data inicial deve ser anterior à data final.");
      }
      return { from, to };
    }
    default:
      throw new PeriodError("Período inválido.");
  }
}

/**
 * Período anterior equivalente, para a comparação "vs. período
 * anterior". Mês/ano usam o mês/ano civil anterior (evita comparar
 * "31 dias" com "28 dias" de forma injusta); os demais presets
 * deslocam pela duração exata do período atual.
 */
export function resolvePreviousPeriod(req: PeriodRequest, now: Date = new Date()): PeriodRange {
  const range = resolvePeriod(req, now);

  if (req.preset === "este-mes" || req.preset === "mes-passado") {
    const start = toBrParts(range.from);
    const prev = prevMonthParts(start.year, start.month);
    return { from: fromBrDate(prev.year, prev.month, 1), to: range.from };
  }

  if (req.preset === "este-ano" || req.preset === "ano-passado") {
    const start = toBrParts(range.from);
    return { from: fromBrDate(start.year - 1, 0, 1), to: range.from };
  }

  const durationMs = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - durationMs), to: range.from };
}

/** Granularidade de gráfico apropriada para o período selecionado. */
export function pickGranularity(req: PeriodRequest, range: PeriodRange): Granularity {
  if (req.preset === "hoje" || req.preset === "ontem") return "hour";
  if (req.preset === "este-ano" || req.preset === "ano-passado") return "month";
  const days = Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS);
  if (days <= 2) return "hour";
  if (days > 92) return "month";
  return "day";
}

/** Chave estável (BR-local) do bucket ao qual um instante pertence. */
export function bucketKey(instant: Date, granularity: Granularity): string {
  const p = toBrParts(instant);
  const mm = String(p.month + 1).padStart(2, "0");
  const dd = String(p.day).padStart(2, "0");
  if (granularity === "month") return `${p.year}-${mm}`;
  if (granularity === "day") return `${p.year}-${mm}-${dd}`;
  const hh = String(p.hour).padStart(2, "0");
  return `${p.year}-${mm}-${dd}T${hh}`;
}

/**
 * Todos os buckets do período, na ordem, mesmo os que não tiverem
 * nenhum pedido — evita que o gráfico "pule" datas sem venda.
 */
export function enumerateBuckets(range: PeriodRange, granularity: Granularity): { key: string; date: Date }[] {
  const buckets: { key: string; date: Date }[] = [];

  if (granularity === "hour") {
    for (let t = range.from.getTime(); t < range.to.getTime(); t += 60 * 60 * 1000) {
      const d = new Date(t);
      buckets.push({ key: bucketKey(d, "hour"), date: d });
    }
    return buckets;
  }

  if (granularity === "day") {
    for (let d = range.from; d.getTime() < range.to.getTime(); d = addDays(d, 1)) {
      buckets.push({ key: bucketKey(d, "day"), date: d });
    }
    return buckets;
  }

  const start = toBrParts(range.from);
  let year = start.year;
  let month = start.month;
  while (fromBrDate(year, month, 1).getTime() < range.to.getTime()) {
    const d = fromBrDate(year, month, 1);
    buckets.push({ key: bucketKey(d, "month"), date: d });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return buckets;
}
