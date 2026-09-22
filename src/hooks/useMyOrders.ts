import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface MyOrderItem {
  id: string;
  productName: string;
  color: string;
  size: string;
  price: number;
  originalPrice?: number | null;
  promotionTitle?: string | null;
  quantity: number;
  /** Capa do produto; `null` quando o cadastro não tem foto. */
  imageUrl: string | null;
  /** Leva de volta à página do produto — `null` se o produto saiu do catálogo. */
  productSlug: string | null;
}

export interface MyOrder {
  id: string;
  orderNumber: string;
  items: MyOrderItem[];
  subtotal: number;
  promotionDiscount?: number;
  discount: number;
  shippingPrice: number;
  total: number;
  paymentMethod: string;
  status: string;
  /** Endereço informado na finalização daquele pedido (o cadastro não guarda endereço fixo). */
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  createdAt: string;
}

export function useMyOrders() {
  return useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.get<{ items: MyOrder[] }>("/api/account/orders").then((r) => r.items),
  });
}
