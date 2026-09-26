import { useQuery } from "@tanstack/react-query";
import { api, buildQueryString } from "../lib/api";
import { adaptProduct, type ProductDTO } from "../lib/adapters";

export interface ProductQuery {
  category?: string;
  featured?: boolean;
  limit?: number;
  q?: string;
  /** Busca exatamente estes produtos (favoritos). */
  ids?: string[];
}

export function useProducts(query: ProductQuery = {}) {
  const qs = buildQueryString({
    category: query.category,
    featured: query.featured,
    limit: query.limit,
    q: query.q,
    ids: query.ids?.join(","),
  });

  return useQuery({
    queryKey: ["products", query],
    // Lista de favoritos vazia: nada a buscar (sem ids a rota devolveria o catálogo).
    enabled: query.ids === undefined || query.ids.length > 0,
    queryFn: async () => {
      const res = await api.get<{ items: ProductDTO[] }>(`/api/products${qs}`);
      return res.items.map(adaptProduct);
    },
  });
}
