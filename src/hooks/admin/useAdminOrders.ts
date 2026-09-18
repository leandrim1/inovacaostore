import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildQueryString } from "../../lib/api";

export interface AdminOrderItem {
  id: string;
  productName: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  shippingPrice: number;
  shippingLabel?: string | null;
  shippingDistanceKm?: number | null;
  shippingMethod?: string | null;
  total: number;
  paymentMethod: string;
  status: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  createdAt: string;
  customer: { name: string; email: string; phone: string };
  items: AdminOrderItem[];
}

export const ORDER_STATUSES = ["pendente", "pago", "separacao", "enviado", "entregue", "cancelado"] as const;

export function useAdminOrders(status?: string) {
  const qs = buildQueryString({ status });
  return useQuery({
    queryKey: ["admin-orders", status],
    queryFn: () => api.get<{ items: AdminOrder[] }>(`/api/admin/orders${qs}`).then((r) => r.items),
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => api.get<AdminOrder>(`/api/admin/orders/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<AdminOrder>(`/api/admin/orders/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-order"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
}
