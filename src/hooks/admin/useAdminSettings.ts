import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { SiteSettings } from "../useSiteSettings";

export type { SiteSettings };

export type SiteSettingsInput = Omit<SiteSettings, "id" | "heroImageUrl">;

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get<SiteSettings>("/api/admin/settings"),
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
    mutationFn: (data: SiteSettingsInput) => api.put<SiteSettings>("/api/admin/settings", data),
    onSuccess: invalidate,
  });
}

export function useUploadHeroImage() {
  const invalidate = useInvalidateSettings();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("image", file);
      return api.upload<SiteSettings>("/api/admin/settings/hero-image", form);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteHeroImage() {
  const invalidate = useInvalidateSettings();
  return useMutation({
    mutationFn: () => api.delete<SiteSettings>("/api/admin/settings/hero-image"),
    onSuccess: invalidate,
  });
}
