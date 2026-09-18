export const PERIOD_PRESETS = [
  { value: "hoje", label: "Hoje" },
  { value: "ontem", label: "Ontem" },
  { value: "ultimos-7-dias", label: "Últimos 7 dias" },
  { value: "esta-semana", label: "Esta semana" },
  { value: "semana-passada", label: "Semana passada" },
  { value: "este-mes", label: "Este mês" },
  { value: "mes-passado", label: "Mês passado" },
  { value: "ultimos-30-dias", label: "Últimos 30 dias" },
  { value: "este-ano", label: "Este ano" },
  { value: "ano-passado", label: "Ano passado" },
  { value: "personalizado", label: "Período personalizado" },
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]["value"];

export interface PeriodFilter {
  preset: PeriodPreset;
  /** "AAAA-MM-DD", só usado quando preset === "personalizado". */
  from?: string;
  /** "AAAA-MM-DD", só usado quando preset === "personalizado". */
  to?: string;
}

export const DEFAULT_PERIOD_FILTER: PeriodFilter = { preset: "este-mes" };

export type SeriesGranularity = "hour" | "day" | "month";

const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Formata a chave de um bucket de série temporal (`"2026-09-18T09"`, `"2026-09-18"` ou `"2026-09"`) no fuso BR, para exibição em gráficos e exportações. */
export function formatSeriesKey(key: string, granularity: SeriesGranularity): string {
  if (granularity === "hour") return `${key.slice(11, 13)}h`;
  if (granularity === "day") {
    const [, m, d] = key.split("-");
    return `${d}/${m}`;
  }
  const [y, m] = key.split("-");
  return `${MONTH_SHORT[Number(m) - 1]}/${y.slice(2)}`;
}
