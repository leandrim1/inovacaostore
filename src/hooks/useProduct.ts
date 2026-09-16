import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { adaptProduct, type ProductDTO } from "../lib/adapters";

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => adaptProduct(await api.get<ProductDTO>(`/api/products/${slug}`)),
    enabled: Boolean(slug),
    retry: false,
  });
}
