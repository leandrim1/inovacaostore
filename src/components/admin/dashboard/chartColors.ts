/**
 * Cores fixas por métrica/entidade — nunca remapeadas entre gráficos, para
 * que a mesma cor sempre signifique a mesma coisa em todo o dashboard.
 */
export const METRIC_COLORS = {
  revenue: "#008300", // faturamento — verde
  profit: "#2a78d6", // lucro — azul
  orders: "#eb6834", // pedidos — laranja
} as const;

export const COSTS_COLOR = "#d03b3b";

// Mesmas cores usadas nos selos de status em AdminOrdersPage/AdminOrderDetailPage
// (bg-*-100/text-*-700), aqui como hex para os gráficos.
export const STATUS_COLORS: Record<string, string> = {
  pendente: "#eab308",
  pago: "#3b82f6",
  separacao: "#a855f7",
  enviado: "#6366f1",
  entregue: "#22c55e",
  cancelado: "#ef4444",
  reembolsado: "#f97316",
};

const PAYMENT_METHOD_COLOR_LIST = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];

export function paymentMethodColor(index: number): string {
  return PAYMENT_METHOD_COLOR_LIST[index % PAYMENT_METHOD_COLOR_LIST.length];
}

export const CHART_GRID_COLOR = "#e1e0d9";
export const CHART_MUTED_TEXT = "#898781";
