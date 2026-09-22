import { useQuery } from "@tanstack/react-query";
import { api, buildQueryString } from "../../lib/api";
import type { AdminOrder } from "./useAdminOrders";
import type { CustomerAddress } from "../useAddresses";

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  createdAt: string;
  /** `false` para quem comprou como convidado e nunca criou senha. */
  hasAccount: boolean;
  /** Todos os pedidos, inclusive cancelados/reembolsados. */
  ordersCount: number;
  /** Só os que contam como venda efetiva (mesma regra do dashboard). */
  paidOrdersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

/** O pedido vem sem o bloco `customer`: quem está olhando já é o cliente da página. */
export type AdminCustomerOrder = Omit<AdminOrder, "customer">;

export interface AdminCustomerDetail {
  customer: AdminCustomer;
  orders: AdminCustomerOrder[];
  /** Caderninho de endereços do cliente — o que ele mesmo cadastrou na conta. */
  addresses: CustomerAddress[];
}

export function useAdminCustomers(q?: string) {
  const qs = buildQueryString({ q });
  return useQuery({
    queryKey: ["admin-customers", q ?? ""],
    queryFn: () => api.get<{ items: AdminCustomer[] }>(`/api/admin/customers${qs}`).then((r) => r.items),
  });
}

export function useAdminCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-customer", id],
    queryFn: () => api.get<AdminCustomerDetail>(`/api/admin/customers/${id}`),
    enabled: Boolean(id),
  });
}
