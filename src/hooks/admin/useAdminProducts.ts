import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildQueryString } from "../../lib/api";
import type { ProductDTO } from "../../lib/adapters";

export interface AdminProductInput {
  name: string;
  slug?: string;
  description: string;
  features: string[];
  tags: string[];
  price: number;
  compareAtPrice?: number | null;
  sku: string;
  featured: boolean;
  active: boolean;
  categoryId: string;
  variants: {
    id?: string;
    color: string;
    colorHex: string;
    size: string;
    stock: number;
    sku?: string;
  }[];
}

export function useAdminProducts(filters: { q?: string; categoryId?: string; active?: string } = {}) {
  const qs = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin-products", filters],
    queryFn: () => api.get<{ items: ProductDTO[] }>(`/api/admin/products${qs}`).then((r) => r.items),
  });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => api.get<ProductDTO>(`/api/admin/products/${id}`),
    enabled: Boolean(id),
  });
}

function useInvalidateProducts() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (data: AdminProductInput) => api.post<ProductDTO>("/api/admin/products", data),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminProductInput> }) =>
      api.patch<ProductDTO>(`/api/admin/products/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/products/${id}`),
    onSuccess: invalidate,
  });
}

export function useUploadProductImages() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) => {
      const form = new FormData();
      files.forEach((f) => form.append("images", f));
      return api.upload<ProductDTO>(`/api/admin/products/${id}/images`, form);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteProductImage() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      api.delete<ProductDTO>(`/api/admin/products/${productId}/images/${imageId}`),
    onSuccess: invalidate,
  });
}
