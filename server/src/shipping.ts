export interface ShippingOption {
  id: "economico" | "expresso";
  label: string;
  days: string;
  price: number;
}

const CEP_PATTERN = /^\d{5}-?\d{3}$/;

export function isValidCep(cep: string) {
  return CEP_PATTERN.test(cep.trim());
}

/**
 * Mesma fórmula determinística usada no frontend (src/lib/shipping.ts) para
 * manter os valores consistentes entre a pré-visualização no carrinho e o
 * valor cobrado de fato no pedido, recalculado aqui no servidor.
 */
export function quoteShipping(cep: string): ShippingOption[] | null {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const seed = digits.split("").reduce((sum, d) => sum + Number(d), 0);
  const regionFactor = Number(digits[0]);

  const economicPrice = 14.9 + (seed % 12) + regionFactor * 0.8;
  const expressPrice = economicPrice + 18 + (seed % 7);

  const economicDays = 5 + (regionFactor % 4);
  const expressDays = 2 + (regionFactor % 2);

  return [
    {
      id: "economico",
      label: "Frete Econômico",
      days: `${economicDays} a ${economicDays + 2} dias úteis`,
      price: Math.round(economicPrice * 100) / 100,
    },
    {
      id: "expresso",
      label: "Frete Expresso",
      days: `${expressDays} a ${expressDays + 1} dias úteis`,
      price: Math.round(expressPrice * 100) / 100,
    },
  ];
}
