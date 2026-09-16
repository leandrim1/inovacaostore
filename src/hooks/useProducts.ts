import { useQuery } from "@tanstack/react-query";
import { api, buildQueryString } from "../lib/api";
import { adaptProduct, type ProductDTO } from "../lib/adapters";

export interface ProductQuery {
  category?: string;
  featured?: boolean;
  limit?: number;
}

export function useProducts(query: ProductQuery = {}) {
  const qs = buildQueryString({
    category: query.category,
    featured: query.featured,
    limit: query.limit,
  });

  return useQuery({
    queryKey: ["products", query],
    queryFn: async () => {
      const res = await api.get<{ items: ProductDTO[] }>(`/api/products${qs}`);
      return res.items.map(adaptProduct);
    },
  });
}
