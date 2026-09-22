import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { markSiteSettingsChanged, type Banner, type HeroImage, type PaymentMethod, type SiteSettings } from "../useSiteSettings";
import type { ImageSettings } from "../../lib/imageSettings";

export type { Banner, HeroImage, PaymentMethod };

/** Campos da faixa de benefícios — salvos pela página Benefícios, à parte. */
export type BenefitsInput = Pick<SiteSettings, `benefit${1 | 2 | 3 | 4}${"Icon" | "Title" | "Text"}`>;

export type SiteSettingsInput = Omit<
  SiteSettings,
  "id" | "heroImages" | "galleryImages" | "banners" | "paymentMethods" | keyof BenefitsInput
>;
export type AdminSiteSettings = Omit<
  SiteSettings,
  "heroImages" | "galleryImages" | "banners" | "paymentMethods"
>;

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
    markSiteSettingsChanged();
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

export function useUpdateBenefits() {
  const invalidate = useInvalidateSettings();
  return useMutation({
    mutationFn: (data: BenefitsInput) => api.put<AdminSiteSettings>("/api/admin/settings/benefits", data),
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
    markSiteSettingsChanged();
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

export function useUpdateHeroImageSettings() {
  const invalidate = useInvalidateHeroImages();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { desktopSettings?: ImageSettings | null; mobileSettings?: ImageSettings | null };
    }) => api.patch<{ items: HeroImage[] }>(`/api/admin/settings/hero-images/${id}`, data),
    onSuccess: invalidate,
  });
}

// --- Banners (faixa acima das Categorias) ---

export function useAdminBanners() {
  return useQuery({
    queryKey: ["admin-banners"],
    queryFn: () => api.get<{ items: Banner[] }>("/api/admin/settings/banners").then((r) => r.items),
  });
}

function useInvalidateBanners() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
    markSiteSettingsChanged();
    qc.invalidateQueries({ queryKey: ["settings"] });
  };
}

export function useUploadBanners() {
  const invalidate = useInvalidateBanners();
  return useMutation({
    mutationFn: (files: File[]) => {
      const form = new FormData();
      files.forEach((file) => form.append("images", file));
      return api.upload<{ items: Banner[] }>("/api/admin/settings/banners", form);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateBanner() {
  const invalidate = useInvalidateBanners();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        linkUrl?: string | null;
        order?: number;
        desktopSettings?: ImageSettings | null;
        mobileSettings?: ImageSettings | null;
      };
    }) => api.patch<Banner>(`/api/admin/settings/banners/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteBanner() {
  const invalidate = useInvalidateBanners();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ items: Banner[] }>(`/api/admin/settings/banners/${id}`),
    onSuccess: invalidate,
  });
}

// --- Formas de pagamento (faixa do rodapé) ---

export function useAdminPaymentMethods() {
  return useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: () =>
      api
        .get<{ items: PaymentMethod[] }>("/api/admin/settings/payment-methods")
        .then((r) => r.items),
  });
}

function useInvalidatePaymentMethods() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-payment-methods"] });
    markSiteSettingsChanged();
    qc.invalidateQueries({ queryKey: ["settings"] });
  };
}

export function useUploadPaymentMethods() {
  const invalidate = useInvalidatePaymentMethods();
  return useMutation({
    mutationFn: (files: File[]) => {
      const form = new FormData();
      files.forEach((file) => form.append("images", file));
      return api.upload<{ items: PaymentMethod[] }>("/api/admin/settings/payment-methods", form);
    },
    onSuccess: invalidate,
  });
}

export function useUpdatePaymentMethod() {
  const invalidate = useInvalidatePaymentMethods();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { label?: string; order?: number } }) =>
      api.patch<PaymentMethod>(`/api/admin/settings/payment-methods/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeletePaymentMethod() {
  const invalidate = useInvalidatePaymentMethods();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ items: PaymentMethod[] }>(`/api/admin/settings/payment-methods/${id}`),
    onSuccess: invalidate,
  });
}

export function useAdminGalleryImages() {
  return useQuery({
    queryKey: ["admin-gallery-images"],
    queryFn: () => api.get<{ items: HeroImage[] }>("/api/admin/settings/gallery-images").then((r) => r.items),
  });
}

function useInvalidateGalleryImages() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-gallery-images"] });
    markSiteSettingsChanged();
    qc.invalidateQueries({ queryKey: ["settings"] });
  };
}

export function useUploadGalleryImages() {
  const invalidate = useInvalidateGalleryImages();
  return useMutation({
    mutationFn: (files: File[]) => {
      const form = new FormData();
      files.forEach((file) => form.append("images", file));
      return api.upload<{ items: HeroImage[] }>("/api/admin/settings/gallery-images", form);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteGalleryImage() {
  const invalidate = useInvalidateGalleryImages();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ items: HeroImage[] }>(`/api/admin/settings/gallery-images/${id}`),
    onSuccess: invalidate,
  });
}

/** Configuração de envio de e-mail vista pelo painel — sem a senha. */
export interface EmailConfigSummary {
  configured: boolean;
  host: string;
  port: number;
  /** Conta mascarada ("le•••••@gmail.com"); `null` se SMTP_USER não existe. */
  user: string | null;
  hasPassword: boolean;
  fromName: string;
}

export type EmailTestResult =
  | { ok: true; to: string }
  | { ok: false; to: string; reason: string; hint: string; detail: string };

export function useEmailConfig() {
  return useQuery({
    queryKey: ["admin-email-config"],
    queryFn: () => api.get<EmailConfigSummary>("/api/admin/settings/email"),
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: () => api.post<EmailTestResult>("/api/admin/settings/email/test"),
  });
}
