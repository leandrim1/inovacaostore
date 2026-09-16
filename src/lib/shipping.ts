export interface ShippingOption {
  id: "economico" | "expresso";
  label: string;
  days: string;
  price: number;
}

export interface ShippingQuote {
  cep: string;
  options: ShippingOption[];
}

const CEP_PATTERN = /^\d{5}-?\d{3}$/;

export function isValidCep(cep: string) {
  return CEP_PATTERN.test(cep.trim());
}

/**
 * Estimativa de frete simulada localmente a partir do CEP (sem integração
 * com transportadora). Determinística: o mesmo CEP sempre retorna o mesmo
 * valor, para dar consistência à demonstração.
 */
export function quoteShipping(cep: string): ShippingQuote | null {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const seed = digits.split("").reduce((sum, d) => sum + Number(d), 0);
  const regionFactor = Number(digits[0]);

  const economicPrice = 14.9 + (seed % 12) + regionFactor * 0.8;
  const expressPrice = economicPrice + 18 + (seed % 7);

  const economicDays = 5 + (regionFactor % 4);
  const expressDays = 2 + (regionFactor % 2);

  return {
    cep: digits,
    options: [
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
    ],
  };
}

export function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
