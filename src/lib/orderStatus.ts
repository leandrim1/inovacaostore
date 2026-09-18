export const ORDER_STATUSES = [
  "pendente",
  "pago",
  "separacao",
  "enviado",
  "entregue",
  "cancelado",
  "reembolsado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  separacao: "Separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

export const STATUS_STYLES: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-700",
  pago: "bg-blue-100 text-blue-700",
  separacao: "bg-purple-100 text-purple-700",
  enviado: "bg-indigo-100 text-indigo-700",
  entregue: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
  reembolsado: "bg-orange-100 text-orange-700",
};
