import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Promotion } from "../usePromotions";

export type { Promotion };

export interface PromotionInput {
  title: string;
  highlight: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  endsAt?: string | null;
  active?: boolean;
  order?: number;
}

export function useAdminPromotions() {
  return useQuery({
    queryKey: ["admin-promotions"],
    queryFn: () => api.get<{ items: Promotion[] }>("/api/admin/promotions").then((r) => r.items),
  });
}

export function useAdminPromotion(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-promotion", id],
    queryFn: () => api.get<Promotion>(`/api/admin/promotions/${id}`),
    enabled: Boolean(id),
  });
}

function useInvalidatePromotions() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-promotions"] });
    qc.invalidateQueries({ queryKey: ["admin-promotion"] });
    qc.invalidateQueries({ queryKey: ["promotions"] });
  };
}

export function useCreatePromotion() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: (data: PromotionInput) => api.post<Promotion>("/api/admin/promotions", data),
    onSuccess: invalidate,
  });
}

export function useUpdatePromotion() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromotionInput> }) =>
      api.patch<Promotion>(`/api/admin/promotions/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeletePromotion() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/promotions/${id}`),
    onSuccess: invalidate,
  });
}

export function useUploadPromotionImage() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("image", file);
      return api.upload<Promotion>(`/api/admin/promotions/${id}/image`, form);
    },
    onSuccess: invalidate,
  });
}

export function useDeletePromotionImage() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: (id: string) => api.delete<Promotion>(`/api/admin/promotions/${id}/image`),
    onSuccess: invalidate,
  });
}
