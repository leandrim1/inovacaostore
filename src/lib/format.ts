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

/**
 * Exibe um telefone brasileiro como "(34) 99657-6357", com ou sem o 55 na
 * frente. Aceita o número já formatado (o checkout guarda como a pessoa
 * digitou) porque limpa tudo que não é dígito antes — e devolve a entrada
 * intacta quando não reconhece o formato, em vez de mostrar algo errado.
 */
export function formatPhoneBR(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;
  const match = local.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (!match) return phone;
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}

/** Máscara progressiva para digitação, usada enquanto o cliente edita seus dados. */
export function maskPhoneBR(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** "1 item" / "3 itens" — o plural de "item" em português não é "items". */
export function formatItemCount(count: number) {
  return `${count} ${count === 1 ? "item" : "itens"}`;
}
