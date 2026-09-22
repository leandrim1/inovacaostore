import { Router } from "express";
import { prisma } from "../db.js";
import { cacheLeituraPublica } from "../security.js";

export const settingsRouter = Router();

const DEFAULT_SETTINGS = {
  id: "singleton",
  heroEyebrow: "NACIONAIS & IMPORTADOS",
  heroTitle: "Estilo que\nfala por você",
  heroDescription:
    "Peças selecionadas para o homem moderno. Até 30% OFF em itens selecionados por tempo limitado.",
  heroCtaLabel: "Comprar agora",
  heroCtaUrl: "/busca",
  whatsappNumber: "5534996576357",
  whatsappMessage: "Olá! Vim pelo site da Inovação Store e gostaria de mais informações.",
  contactEmail: "inovacaostoretiktok@gmail.com",
  addressStreet: "Rua Ouro Preto, 784",
  addressCity: "Patos de Minas",
  addressState: "MG",
  addressZip: "38700-000",
  announcementItem1: "Frete grátis acima de R$ 299",
  announcementItem2: "Troca fácil em até 30 dias",
  announcementItem3: "Pagamento 100% seguro",
  announcementItem4: "Atendimento rápido pelo WhatsApp",
};

// 10s frescos + 1 dia servindo a cópia anterior enquanto revalida.
//
// O hero não aparece antes desta resposta chegar, então ela não pode esperar
// a função "acordar": com stale-while-revalidate longo a borda da Vercel
// entrega a última cópia NA HORA e atualiza em segundo plano — a função fria
// sai do caminho do visitante. (A versão anterior, 10s + 10s, fazia o
// contrário: quase toda visita caía na função fria, e o hero ficava preto.)
//
// E o lojista que acabou de salvar? O painel marca a mudança no navegador
// dele (markSiteSettingsChanged) e a loja passa a pedir `?v=<marca>` — uma
// URL que a borda ainda não tem —, então ele vê a mudança na hora. Os demais
// visitantes recebem a versão nova no máximo uma visita depois dos 10s.
settingsRouter.get("/", cacheLeituraPublica(10, 86_400), async (_req, res) => {
  const [settings, heroImages, galleryImages, banners, paymentMethods] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.heroImage.findMany({ orderBy: { order: "asc" } }),
    prisma.galleryImage.findMany({ orderBy: { order: "asc" } }),
    prisma.banner.findMany({ orderBy: { order: "asc" } }),
    prisma.paymentMethod.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
  ]);
  res.json({ ...(settings ?? DEFAULT_SETTINGS), heroImages, galleryImages, banners, paymentMethods });
});
