import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface FreeShippingRegion {
  state: string;
  city?: string;
}

export interface AdminShippingSettings {
  id: string;
  enabled: boolean;
  originLat: number;
  originLng: number;
  freeShippingMinOrderValue: number | null;
  freeShippingRegions: FreeShippingRegion[];
  minShippingPrice: number;
  freeWeightKg: number;
  pricePerExtraKg: number;
  freeVolumeM3: number;
  pricePerExtraM3: number;
  fallbackFlatPrice: number;
  updatedAt: string;
}

export type ShippingSettingsInput = Omit<AdminShippingSettings, "id" | "updatedAt">;

export interface ShippingTier {
  id: string;
  minKm: number;
  maxKm: number | null;
  price: number;
  etaLabel: string | null;
  order: number;
}

export interface ShippingTierInput {
  minKm: number;
  maxKm: number | null;
  price: number;
  etaLabel: string;
  order: number;
}

export function useAdminShippingSettings() {
  return useQuery({
    queryKey: ["admin-shipping-settings"],
    queryFn: () => api.get<AdminShippingSettings>("/api/admin/shipping/settings"),
  });
}

export function useUpdateShippingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ShippingSettingsInput) => api.put<AdminShippingSettings>("/api/admin/shipping/settings", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shipping-settings"] }),
  });
}

export function useAdminShippingTiers() {
  return useQuery({
    queryKey: ["admin-shipping-tiers"],
    queryFn: () => api.get<{ items: ShippingTier[] }>("/api/admin/shipping/tiers").then((r) => r.items),
  });
}

function useInvalidateShippingTiers() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin-shipping-tiers"] });
}

export function useCreateShippingTier() {
  const invalidate = useInvalidateShippingTiers();
  return useMutation({
    mutationFn: (data: ShippingTierInput) => api.post<ShippingTier>("/api/admin/shipping/tiers", data),
    onSuccess: invalidate,
  });
}

export function useUpdateShippingTier() {
  const invalidate = useInvalidateShippingTiers();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShippingTierInput }) =>
      api.put<ShippingTier>(`/api/admin/shipping/tiers/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteShippingTier() {
  const invalidate = useInvalidateShippingTiers();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/shipping/tiers/${id}`),
    onSuccess: invalidate,
  });
}
