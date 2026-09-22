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

// Janela bem mais curta que a dos produtos (10s + 10s em vez de 60s + 60s).
// Configurações são o que o lojista confere NA HORA depois de salvar: com a
// janela antiga, trocar as imagens do hero e abrir o site em seguida ainda
// mostrava a versão anterior por até 2 minutos — parecendo que não salvou. A
// resposta é pequena e cabe numa consulta; 10s ainda tira quase todas as
// visitas do banco.
settingsRouter.get("/", cacheLeituraPublica(10, 10), async (_req, res) => {
  const [settings, heroImages, galleryImages, banners, paymentMethods] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.heroImage.findMany({ orderBy: { order: "asc" } }),
    prisma.galleryImage.findMany({ orderBy: { order: "asc" } }),
    prisma.banner.findMany({ orderBy: { order: "asc" } }),
    prisma.paymentMethod.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
  ]);
  res.json({ ...(settings ?? DEFAULT_SETTINGS), heroImages, galleryImages, banners, paymentMethods });
});
