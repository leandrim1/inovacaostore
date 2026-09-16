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

export function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
