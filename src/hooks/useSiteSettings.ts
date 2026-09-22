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
/** Bandeira da faixa de pagamento do rodapé, enviada pelo painel. */
export interface PaymentMethod {
  id: string;
  url: string;
  /** Nome da bandeira; vai para o leitor de tela e para o `title`. */
  label: string;
  order: number;
}

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
  paymentMethods: PaymentMethod[];
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
  /** Faixa de benefícios da home. Ícone = chave de src/lib/benefitIcons.ts. */
  benefit1Icon: string;
  benefit1Title: string;
  benefit1Text: string;
  benefit2Icon: string;
  benefit2Title: string;
  benefit2Text: string;
  benefit3Icon: string;
  benefit3Title: string;
  benefit3Text: string;
  benefit4Icon: string;
  benefit4Title: string;
  benefit4Text: string;
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
  paymentMethods: [],
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
  benefit1Icon: "truck",
  benefit1Title: "Frete grátis",
  benefit1Text: "Em compras acima de R$ 299 para todo o Brasil.",
  benefit2Icon: "refresh",
  benefit2Title: "Troca fácil",
  benefit2Text: "Até 30 dias para trocar ou devolver sem complicação.",
  benefit3Icon: "shield",
  benefit3Title: "Pagamento seguro",
  benefit3Text: "Ambiente 100% protegido com múltiplas formas de pagamento.",
  benefit4Icon: "headset",
  benefit4Title: "Atendimento rápido",
  benefit4Text: "Suporte pelo WhatsApp para tirar suas dúvidas na hora.",
};

/**
 * Última configuração recebida, guardada no aparelho do visitante.
 *
 * O hero não aparece antes de saber quais imagens o painel tem. Sem cache
 * local, quem voltava ao site esperava tudo de novo, como na primeira visita
 * (medido: 6,2 s até a imagem aparecer no celular). Com ele, o hero já nasce
 * com a imagem da última visita e a resposta nova só confirma ou atualiza.
 *
 * São dados públicos (os mesmos de /api/settings), então não há o que
 * proteger aqui. Todo acesso vai em try/catch: aba anônima e armazenamento
 * cheio fazem `localStorage` lançar, e isso não pode derrubar a loja.
 */
const CACHE_KEY = "inovacao:settings:v1";
/** Marca de "o lojista acabou de mudar algo" — ver `markSiteSettingsChanged`. */
const CHANGED_KEY = "inovacao:settings:changed";
/** Por quanto tempo depois de salvar o navegador do lojista fura o cache da borda. */
const CHANGED_WINDOW_MS = 5 * 60 * 1000;

interface CachedSettings {
  savedAt: number;
  data: SiteSettings;
}

export function readCachedSiteSettings(): CachedSettings | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<CachedSettings> | null;
    if (!parsed || typeof parsed.savedAt !== "number" || !parsed.data || !Array.isArray(parsed.data.heroImages)) {
      return undefined;
    }
    // Mescla com os padrões: um campo que exista no código mas não num cache
    // antigo não pode chegar como `undefined` aos componentes.
    return { savedAt: parsed.savedAt, data: { ...DEFAULT_SITE_SETTINGS, ...parsed.data } };
  } catch {
    return undefined;
  }
}

function writeCachedSiteSettings(data: SiteSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Sem espaço ou aba anônima: a loja segue funcionando, só sem o atalho.
  }
}

/**
 * URL das configurações. Logo depois de o lojista salvar algo no painel, ela
 * ganha `?v=<marca>`: uma URL que a borda da Vercel ainda não guardou, então
 * a resposta vem fresca da função e ele vê a mudança na hora. Os visitantes
 * não têm a marca e continuam na URL em cache (rápida).
 */
function settingsUrl() {
  try {
    const marca = Number(localStorage.getItem(CHANGED_KEY));
    if (marca && Date.now() - marca < CHANGED_WINDOW_MS) return `/api/settings?v=${marca}`;
  } catch {
    // ignora
  }
  return "/api/settings";
}

/**
 * Chamada pelo painel depois de salvar configurações ou imagens: descarta a
 * cópia local e marca a mudança. Sem isso, o lojista abria a loja e via a
 * versão antiga (do cache do navegador ou da borda), achando que não salvou.
 */
export function markSiteSettingsChanged() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.setItem(CHANGED_KEY, String(Date.now()));
  } catch {
    // ignora
  }
}

export function useSiteSettings() {
  const query = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const data = await api.get<SiteSettings>(settingsUrl());
      writeCachedSiteSettings(data);
      return data;
    },
    staleTime: 60 * 1000,
    // Com cópia local: o hero usa na hora (não é placeholder, então não
    // espera). `initialDataUpdatedAt: 0` marca essa cópia como velha, então a
    // consulta SEMPRE busca a versão atual em seguida — a cópia é um atalho
    // de exibição, nunca a palavra final.
    initialData: () => readCachedSiteSettings()?.data,
    initialDataUpdatedAt: 0,
    // Sem cópia local (primeira visita): padrões de código como marcador.
    // O hero reconhece esse estado por `isPlaceholderData` e espera.
    placeholderData: DEFAULT_SITE_SETTINGS,
  });
  // Garante `data` sempre definido (nunca undefined) — evita checagem
  // redundante em cada componente que consome as configurações.
  return { ...query, data: query.data ?? DEFAULT_SITE_SETTINGS };
}
