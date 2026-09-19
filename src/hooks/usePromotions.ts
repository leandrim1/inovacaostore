import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ImageSettings } from "../lib/imageSettings";

export interface Promotion {
  id: string;
  title: string;
  highlight: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string | null;
  desktopSettings: ImageSettings | null;
  mobileSettings: ImageSettings | null;
  endsAt: string | null;
  active: boolean;
  order: number;
}

export function usePromotions() {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: () => api.get<{ items: Promotion[] }>("/api/promotions").then((r) => r.items),
    staleTime: 60 * 1000,
  });
}
