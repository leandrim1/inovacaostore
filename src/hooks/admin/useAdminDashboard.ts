import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { AdminOrder } from "./useAdminOrders";

export interface AdminDashboard {
  productCount: number;
  activeProductCount: number;
  orderCount: number;
  pendingOrderCount: number;
  categoryCount: number;
  lowStockVariants: number;
  recentOrders: AdminOrder[];
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get<AdminDashboard>("/api/admin/dashboard"),
  });
}
