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

export const CANCELLED_STATUS: OrderStatus = "cancelado";
export const REFUNDED_STATUS: OrderStatus = "reembolsado";
