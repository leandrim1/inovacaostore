import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { ImageSettings } from "../../lib/imageSettings";

/**
 * A promoção como o painel a vê. Difere da versão pública: aqui vêm os ids
 * crus (`categoryId`, `productIds`) que o formulário precisa preencher, e não
 * vem `discounting`, que só faz sentido para a vitrine.
 */
export interface AdminPromotion {
  id: string;
  title: string;
  highlight: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string | null;
  desktopSettings: ImageSettings | null;
  mobileSettings: ImageSettings | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  order: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountScope: "all" | "category" | "products";
  categoryId: string | null;
  productIds: string[];
  category: { id: string; slug: string; name: string } | null;
}

export interface PromotionInput {
  title: string;
  highlight: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  desktopSettings?: ImageSettings | null;
  mobileSettings?: ImageSettings | null;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
  order?: number;
  discountType?: "percent" | "fixed";
  discountValue?: number;
  discountScope?: "all" | "category" | "products";
  categoryId?: string | null;
  productIds?: string[];
}

export function useAdminPromotions() {
  return useQuery({
    queryKey: ["admin-promotions"],
    queryFn: () => api.get<{ items: AdminPromotion[] }>("/api/admin/promotions").then((r) => r.items),
  });
}

export function useAdminPromotion(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-promotion", id],
    queryFn: () => api.get<AdminPromotion>(`/api/admin/promotions/${id}`),
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
    mutationFn: (data: PromotionInput) => api.post<AdminPromotion>("/api/admin/promotions", data),
    onSuccess: invalidate,
  });
}

export function useUpdatePromotion() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromotionInput> }) =>
      api.patch<AdminPromotion>(`/api/admin/promotions/${id}`, data),
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
      return api.upload<AdminPromotion>(`/api/admin/promotions/${id}/image`, form);
    },
    onSuccess: invalidate,
  });
}

export function useDeletePromotionImage() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: (id: string) => api.delete<AdminPromotion>(`/api/admin/promotions/${id}/image`),
    onSuccess: invalidate,
  });
}
