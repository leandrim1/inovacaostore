import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildQueryString } from "../../lib/api";

export type TestimonialStatus = "pendente" | "aprovado" | "reprovado";

export interface AdminTestimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  quote: string;
  status: TestimonialStatus;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; email: string } | null;
}

export interface AdminTestimonialInput {
  status?: TestimonialStatus;
  featured?: boolean;
  order?: number;
  name?: string;
  city?: string;
  rating?: number;
  quote?: string;
}

export function useAdminTestimonials(filters: { status?: string } = {}) {
  const qs = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin-testimonials", filters],
    queryFn: () =>
      api.get<{ items: AdminTestimonial[]; pendingCount: number }>(`/api/admin/testimonials${qs}`),
  });
}

function useInvalidateTestimonials() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    // A lista pública e a nota média mudam junto com a moderação.
    qc.invalidateQueries({ queryKey: ["testimonials"] });
  };
}

export function useUpdateTestimonial() {
  const invalidate = useInvalidateTestimonials();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminTestimonialInput }) =>
      api.patch<AdminTestimonial>(`/api/admin/testimonials/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteTestimonial() {
  const invalidate = useInvalidateTestimonials();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/testimonials/${id}`),
    onSuccess: invalidate,
  });
}
