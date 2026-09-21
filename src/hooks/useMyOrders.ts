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
  createdAt: string;
}

export function useMyOrders() {
  return useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.get<{ items: MyOrder[] }>("/api/account/orders").then((r) => r.items),
  });
}
