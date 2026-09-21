import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ImageSettings } from "../lib/imageSettings";
import { STORE } from "../data/store";

export interface HeroImage {
  id: string;
  url: string;
  desktopSettings?: ImageSettings | null;
  mobileSettings?: ImageSettings | null;
}

/** Imagem da faixa acima das Categorias. */
export interface Banner {
  id: string;
  url: string;
  /** Opcional: com link, clicar na imagem leva a essa página. */
  linkUrl: string | null;
  desktopSettings?: ImageSettings | null;
  mobileSettings?: ImageSettings | null;
  order: number;
}

export interface SiteSettings {
  id: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroCtaLabel: string;
  heroCtaUrl: string;
  heroImages: HeroImage[];
  galleryImages: HeroImage[];
  banners: Banner[];
  whatsappNumber: string;
  whatsappMessage: string;
  contactEmail: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  announcementItem1: string;
  announcementItem2: string;
  announcementItem3: string;
  announcementItem4: string;
}

// Mesmo conteúdo usado como default no backend (server/src/routes/settings.routes.ts)
// — evita qualquer flash de conteúdo vazio enquanto a primeira requisição carrega.
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: "singleton",
  heroEyebrow: "NACIONAIS & IMPORTADOS",
  heroTitle: "Estilo que\nfala por você",
  heroDescription:
    "Peças selecionadas para o homem moderno. Até 30% OFF em itens selecionados por tempo limitado.",
  heroCtaLabel: "Comprar agora",
  heroCtaUrl: "/busca",
  heroImages: [],
  galleryImages: [],
  banners: [],
  whatsappNumber: "5534996576357",
  whatsappMessage: "Olá! Vim pelo site da Inovação Store e gostaria de mais informações.",
  contactEmail: "inovacaostoretiktok@gmail.com",
  addressStreet: STORE.address.street,
  addressCity: STORE.address.city,
  addressState: STORE.address.state,
  addressZip: STORE.address.zip,
  announcementItem1: "Frete grátis acima de R$ 299",
  announcementItem2: "Troca fácil em até 30 dias",
  announcementItem3: "Pagamento 100% seguro",
  announcementItem4: "Atendimento rápido pelo WhatsApp",
};

export function useSiteSettings() {
  const query = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<SiteSettings>("/api/settings"),
    staleTime: 60 * 1000,
    placeholderData: DEFAULT_SITE_SETTINGS,
  });
  // Garante `data` sempre definido (nunca undefined) — evita checagem
  // redundante em cada componente que consome as configurações.
  return { ...query, data: query.data ?? DEFAULT_SITE_SETTINGS };
}
