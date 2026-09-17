import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { HeroImage, SiteSettings } from "../useSiteSettings";

export type { HeroImage };

export type SiteSettingsInput = Omit<SiteSettings, "id" | "heroImages">;
export type AdminSiteSettings = Omit<SiteSettings, "heroImages">;

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get<AdminSiteSettings>("/api/admin/settings"),
  });
}

function useInvalidateSettings() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-settings"] });
    qc.invalidateQueries({ queryKey: ["settings"] });
  };
}

export function useUpdateSettings() {
  const invalidate = useInvalidateSettings();
  return useMutation({
    mutationFn: (data: SiteSettingsInput) => api.put<AdminSiteSettings>("/api/admin/settings", data),
    onSuccess: invalidate,
  });
}

export function useAdminHeroImages() {
  return useQuery({
    queryKey: ["admin-hero-images"],
    queryFn: () => api.get<{ items: HeroImage[] }>("/api/admin/settings/hero-images").then((r) => r.items),
  });
}

function useInvalidateHeroImages() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-hero-images"] });
    qc.invalidateQueries({ queryKey: ["settings"] });
  };
}

export function useUploadHeroImages() {
  const invalidate = useInvalidateHeroImages();
  return useMutation({
    mutationFn: (files: File[]) => {
      const form = new FormData();
      files.forEach((file) => form.append("images", file));
      return api.upload<{ items: HeroImage[] }>("/api/admin/settings/hero-images", form);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteHeroImage() {
  const invalidate = useInvalidateHeroImages();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ items: HeroImage[] }>(`/api/admin/settings/hero-images/${id}`),
    onSuccess: invalidate,
  });
}
