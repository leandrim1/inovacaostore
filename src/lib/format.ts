export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatInstallments(price: number, max: number) {
  if (max <= 1) return formatBRL(price);
  const installment = price / max;
  return `${max}x de ${formatBRL(installment)} sem juros`;
}

export function discountPercent(price: number, compareAtPrice?: number) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/** `null` (variação indisponível, ex.: período anterior zerado) vira "—", nunca um número inventado. */
export function formatPct(value: number | null, digits = 1) {
  if (value == null) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPct(value: number | null, digits = 1) {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}
