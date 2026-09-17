import { Router } from "express";
import { prisma } from "../db.js";

export const settingsRouter = Router();

const DEFAULT_SETTINGS = {
  id: "singleton",
  heroEyebrow: "NACIONAIS & IMPORTADOS",
  heroTitle: "Estilo que\nfala por você",
  heroDescription:
    "Peças selecionadas para o homem moderno. Até 30% OFF em itens selecionados por tempo limitado.",
  heroCtaLabel: "Comprar agora",
  heroCtaUrl: "/categoria/camisetas",
  whatsappNumber: "5534996576357",
  whatsappMessage: "Olá! Vim pelo site da Inovação Store e gostaria de mais informações.",
  contactEmail: "inovacaostoretiktok@gmail.com",
  announcementItem1: "Frete grátis acima de R$ 299",
  announcementItem2: "Troca fácil em até 30 dias",
  announcementItem3: "Pagamento 100% seguro",
  announcementItem4: "Atendimento rápido pelo WhatsApp",
};

settingsRouter.get("/", async (_req, res) => {
  const [settings, heroImages] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.heroImage.findMany({ orderBy: { order: "asc" } }),
  ]);
  res.json({ ...(settings ?? DEFAULT_SETTINGS), heroImages });
});
