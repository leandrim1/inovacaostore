import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Category } from "../data/types";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/api/categories"),
    staleTime: 5 * 60 * 1000,
  });
}
