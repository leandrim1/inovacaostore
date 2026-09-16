import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  order: number;
  productCount: number;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  order?: number;
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get<AdminCategory[]>("/api/admin/categories"),
  });
}

function useInvalidateCategories() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (data: CategoryInput) => api.post<AdminCategory>("/api/admin/categories", data),
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryInput> }) =>
      api.patch<AdminCategory>(`/api/admin/categories/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/categories/${id}`),
    onSuccess: invalidate,
  });
}
