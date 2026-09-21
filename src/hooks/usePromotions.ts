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
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  order: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountScope: "all" | "category" | "products";
  category: { slug: string; name: string } | null;
  /** true quando a promoção está de fato mexendo em preço (não só banner). */
  discounting: boolean;
}

export function usePromotions() {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: () => api.get<{ items: Promotion[] }>("/api/promotions").then((r) => r.items),
    staleTime: 60 * 1000,
  });
}
