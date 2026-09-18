import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface Coupon {
  id: string;
  code: string;
  description: string;
  percentOff: number;
  active: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  maxRedemptions: number | null;
  maxRedemptionsPerCustomer: number | null;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponInput {
  code: string;
  description?: string;
  percentOff: number;
  active?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxRedemptions?: number | null;
  maxRedemptionsPerCustomer?: number | null;
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get<{ items: Coupon[] }>("/api/admin/coupons").then((r) => r.items),
  });
}

export function useAdminCoupon(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-coupon", id],
    queryFn: () => api.get<Coupon>(`/api/admin/coupons/${id}`),
    enabled: Boolean(id),
  });
}

function useInvalidateCoupons() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    qc.invalidateQueries({ queryKey: ["admin-coupon"] });
  };
}

export function useCreateCoupon() {
  const invalidate = useInvalidateCoupons();
  return useMutation({
    mutationFn: (data: CouponInput) => api.post<Coupon>("/api/admin/coupons", data),
    onSuccess: invalidate,
  });
}

export function useUpdateCoupon() {
  const invalidate = useInvalidateCoupons();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<CouponInput, "code">> }) =>
      api.patch<Coupon>(`/api/admin/coupons/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteCoupon() {
  const invalidate = useInvalidateCoupons();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/coupons/${id}`),
    onSuccess: invalidate,
  });
}
