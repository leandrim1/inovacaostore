import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";
import { upload, saveValidatedImage } from "../../upload.js";
import { deleteUpload } from "../../storage.js";
import { imageSettingsPatchSchema } from "../../imageSettings.js";
import { classifyEmailError, describeEmailConfig, sendEmail } from "../../email.js";
import { BENEFIT_ICON_KEYS } from "../../benefitIcons.js";

export const adminSettingsRouter = Router();

const settingsSchema = z.object({
  heroEyebrow: z.string().min(1),
  heroTitle: z.string().min(1),
  heroDescription: z.string().min(1),
  heroCtaLabel: z.string().min(1),
  heroCtaUrl: z.string().min(1),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, "Use apenas números, com DDI e DDD (ex: 5534999998888)."),
  whatsappMessage: z.string().min(1),
  contactEmail: z.string().email("E-mail inválido."),
  addressStreet: z.string().min(1, "Informe a rua e o número.").max(120),
  addressCity: z.string().min(1, "Informe a cidade.").max(80),
  addressState: z.string().regex(/^\s*[A-Za-z]{2}\s*$/, "Use a sigla do estado com 2 letras (ex: MG)."),
  addressZip: z.string().regex(/^\s*\d{5}-?\d{3}\s*$/, "CEP inválido. Use o formato 38700-000."),
  announcementItem1: z.string().min(1),
  announcementItem2: z.string().min(1),
  announcementItem3: z.string().min(1),
  announcementItem4: z.string().min(1),
});

// Faixa de benefícios da home — página própria no painel (Benefícios), com
// rota própria: salvar lá nunca reescreve as outras configurações, e salvar
// em Configurações nunca mexe nos benefícios (o schema acima nem os conhece,
// e o zod descarta campos que não declarou).
//
// Os limites vêm do layout: a faixa tem 2 colunas no celular, e um título
// maior que isso quebra em várias linhas e desalinha os quatro itens.
const benefitIcon = z.enum(BENEFIT_ICON_KEYS);
const benefitTitle = z.string().trim().min(1, "Informe o título do benefício.").max(40);
const benefitText = z.string().trim().min(1, "Informe o texto do benefício.").max(140);

const benefitsSchema = z.object({
  benefit1Icon: benefitIcon,
  benefit1Title: benefitTitle,
  benefit1Text: benefitText,
  benefit2Icon: benefitIcon,
  benefit2Title: benefitTitle,
  benefit2Text: benefitText,
  benefit3Icon: benefitIcon,
  benefit3Title: benefitTitle,
  benefit3Text: benefitText,
  benefit4Icon: benefitIcon,
  benefit4Title: benefitTitle,
  benefit4Text: benefitText,
});

adminSettingsRouter.get("/", async (_req, res) => {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    res.status(404).json({ error: "Configurações ainda não inicializadas." });
    return;
  }
  res.json(settings);
});

adminSettingsRouter.put("/", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = {
    ...parsed.data,
    addressStreet: parsed.data.addressStreet.trim(),
    addressCity: parsed.data.addressCity.trim(),
    addressState: parsed.data.addressState.trim().toUpperCase(),
    // Guarda sempre no formato 00000-000, venha com hífen ou sem.
    addressZip: parsed.data.addressZip.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"),
  };

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  res.json(settings);
});

adminSettingsRouter.put("/benefits", async (req, res) => {
  const parsed = benefitsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  try {
    // `update`, não `upsert`: criar a linha exigiria inventar o resto das
    // configurações. Ela sempre existe depois do seed.
    const settings = await prisma.siteSettings.update({
      where: { id: "singleton" },
      data: parsed.data,
    });
    res.json(settings);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      res.status(404).json({ error: "Configurações ainda não inicializadas." });
      return;
    }
    throw err;
  }
});

adminSettingsRouter.get("/hero-images", async (_req, res) => {
  const heroImages = await prisma.heroImage.findMany({ orderBy: { order: "asc" } });
  res.json({ items: heroImages });
});

adminSettingsRouter.post("/hero-images", upload.array("images", 8), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (files.length === 0) {
    res.status(400).json({ error: "Nenhuma imagem enviada." });
    return;
  }

  const currentCount = await prisma.heroImage.count();
  const urls = await Promise.all(
    files.map((file) => saveValidatedImage(file.buffer)),
  );
  await prisma.heroImage.createMany({
    data: urls.map((url, i) => ({ url, order: currentCount + i })),
  });

  const heroImages = await prisma.heroImage.findMany({ orderBy: { order: "asc" } });
  res.status(201).json({ items: heroImages });
});

adminSettingsRouter.patch("/hero-images/:id", async (req, res) => {
  const parsed = imageSettingsPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }

  const image = await prisma.heroImage.findUnique({ where: { id: req.params.id } });
  if (!image) {
    res.status(404).json({ error: "Imagem não encontrada." });
    return;
  }

  const data = parsed.data;
  await prisma.heroImage.update({
    where: { id: image.id },
    data: {
      ...(data.desktopSettings !== undefined
        ? { desktopSettings: data.desktopSettings ?? Prisma.DbNull }
        : {}),
      ...(data.mobileSettings !== undefined
        ? { mobileSettings: data.mobileSettings ?? Prisma.DbNull }
        : {}),
    },
  });

  const heroImages = await prisma.heroImage.findMany({ orderBy: { order: "asc" } });
  res.json({ items: heroImages });
});

adminSettingsRouter.delete("/hero-images/:id", async (req, res) => {
  const image = await prisma.heroImage.findUnique({ where: { id: req.params.id } });
  if (!image) {
    res.status(404).json({ error: "Imagem não encontrada." });
    return;
  }

  await prisma.heroImage.delete({ where: { id: image.id } });
  await deleteUpload(image.url);

  const heroImages = await prisma.heroImage.findMany({ orderBy: { order: "asc" } });
  res.json({ items: heroImages });
});

// ---------------------------------------------------------------------------
// Banners (faixa de imagens acima das Categorias)
// ---------------------------------------------------------------------------

const listarBanners = () => prisma.banner.findMany({ orderBy: { order: "asc" } });

adminSettingsRouter.get("/banners", async (_req, res) => {
  res.json({ items: await listarBanners() });
});

adminSettingsRouter.post("/banners", upload.array("images", 10), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (files.length === 0) {
    res.status(400).json({ error: "Nenhuma imagem enviada." });
    return;
  }

  const currentCount = await prisma.banner.count();
  const urls = await Promise.all(files.map((file) => saveValidatedImage(file.buffer)));
  await prisma.banner.createMany({
    data: urls.map((url, i) => ({ url, order: currentCount + i })),
  });

  res.status(201).json({ items: await listarBanners() });
});

const bannerPatchSchema = z.object({
  // "" apaga o link; undefined deixa como está.
  linkUrl: z.string().max(300).nullable().optional(),
  order: z.number().int().min(0).optional(),
  desktopSettings: imageSettingsPatchSchema.shape.desktopSettings,
  mobileSettings: imageSettingsPatchSchema.shape.mobileSettings,
});

adminSettingsRouter.patch("/banners/:id", async (req, res) => {
  const parsed = bannerPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  const existe = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!existe) {
    res.status(404).json({ error: "Banner não encontrado." });
    return;
  }

  const banner = await prisma.banner.update({
    where: { id: req.params.id },
    data: {
      ...(data.linkUrl !== undefined ? { linkUrl: data.linkUrl?.trim() || null } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
      ...(data.desktopSettings !== undefined
        ? { desktopSettings: data.desktopSettings ?? Prisma.DbNull }
        : {}),
      ...(data.mobileSettings !== undefined
        ? { mobileSettings: data.mobileSettings ?? Prisma.DbNull }
        : {}),
    },
  });
  res.json(banner);
});

adminSettingsRouter.delete("/banners/:id", async (req, res) => {
  const banner = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!banner) {
    res.status(404).json({ error: "Banner não encontrado." });
    return;
  }

  await prisma.banner.delete({ where: { id: banner.id } });
  await deleteUpload(banner.url);

  res.json({ items: await listarBanners() });
});

// ---------------------------------------------------------------------------
// Formas de pagamento (faixa do rodapé)
// ---------------------------------------------------------------------------

function listarFormasDePagamento() {
  return prisma.paymentMethod.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
}

adminSettingsRouter.get("/payment-methods", async (_req, res) => {
  res.json({ items: await listarFormasDePagamento() });
});

adminSettingsRouter.post("/payment-methods", upload.array("images", 8), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (files.length === 0) {
    res.status(400).json({ error: "Nenhuma imagem enviada." });
    return;
  }

  const currentCount = await prisma.paymentMethod.count();
  const urls = await Promise.all(files.map((file) => saveValidatedImage(file.buffer)));
  await prisma.paymentMethod.createMany({
    // O nome começa vazio: o upload é múltiplo e o servidor não tem como
    // saber qual arquivo é qual bandeira. O admin preenche na lista.
    data: urls.map((url, i) => ({ url, order: currentCount + i })),
  });

  res.status(201).json({ items: await listarFormasDePagamento() });
});

const paymentMethodPatchSchema = z.object({
  label: z.string().max(40).optional(),
  order: z.number().int().min(0).optional(),
});

adminSettingsRouter.patch("/payment-methods/:id", async (req, res) => {
  const parsed = paymentMethodPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  const existe = await prisma.paymentMethod.findUnique({ where: { id: req.params.id } });
  if (!existe) {
    res.status(404).json({ error: "Forma de pagamento não encontrada." });
    return;
  }

  const atualizada = await prisma.paymentMethod.update({
    where: { id: req.params.id },
    data: {
      ...(data.label !== undefined ? { label: data.label.trim() } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
    },
  });
  res.json(atualizada);
});

adminSettingsRouter.delete("/payment-methods/:id", async (req, res) => {
  const forma = await prisma.paymentMethod.findUnique({ where: { id: req.params.id } });
  if (!forma) {
    res.status(404).json({ error: "Forma de pagamento não encontrada." });
    return;
  }

  await prisma.paymentMethod.delete({ where: { id: forma.id } });
  // As dez bandeiras iniciais apontam para arquivos do próprio projeto
  // (/formas-pagamento/…), não para uploads. Apagar o arquivo nesse caso
  // seria remover um asset versionado — e o `basename` poderia coincidir com
  // algum upload legítimo. Só limpamos o que de fato foi enviado.
  if (forma.url.startsWith("/uploads/") || /^https?:\/\//.test(forma.url)) {
    await deleteUpload(forma.url);
  }

  res.json({ items: await listarFormasDePagamento() });
});

adminSettingsRouter.get("/gallery-images", async (_req, res) => {
  const galleryImages = await prisma.galleryImage.findMany({ orderBy: { order: "asc" } });
  res.json({ items: galleryImages });
});

adminSettingsRouter.post("/gallery-images", upload.array("images", 20), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (files.length === 0) {
    res.status(400).json({ error: "Nenhuma imagem enviada." });
    return;
  }

  const currentCount = await prisma.galleryImage.count();
  const urls = await Promise.all(
    files.map((file) => saveValidatedImage(file.buffer)),
  );
  await prisma.galleryImage.createMany({
    data: urls.map((url, i) => ({ url, order: currentCount + i })),
  });

  const galleryImages = await prisma.galleryImage.findMany({ orderBy: { order: "asc" } });
  res.status(201).json({ items: galleryImages });
});

adminSettingsRouter.delete("/gallery-images/:id", async (req, res) => {
  const image = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
  if (!image) {
    res.status(404).json({ error: "Imagem não encontrada." });
    return;
  }

  await prisma.galleryImage.delete({ where: { id: image.id } });
  await deleteUpload(image.url);

  const galleryImages = await prisma.galleryImage.findMany({ orderBy: { order: "asc" } });
  res.json({ items: galleryImages });
});

/**
 * Diagnóstico do envio de e-mail (código de verificação, redefinição de
 * senha). Existe porque a configuração mora nas variáveis de ambiente da
 * Vercel, que o lojista não enxerga pelo site: sem isto, "o código não chega"
 * não tem como ser investigado sem acesso ao log do servidor.
 */
const EMAIL_HINTS: Record<string, string> = {
  nao_configurado:
    "As variáveis SMTP_USER e/ou SMTP_PASSWORD não estão definidas na Vercel. Cadastre as duas em Settings › Environment Variables e faça um novo deploy.",
  autenticacao:
    "O servidor de e-mail recusou o login. No Gmail, SMTP_PASSWORD precisa ser uma senha de app (16 letras, gerada em myaccount.google.com/apppasswords com a verificação em duas etapas ativa) — a senha normal da conta não funciona.",
  conexao:
    "Não foi possível conectar ao servidor de e-mail. Confira SMTP_HOST e SMTP_PORT — para Gmail: smtp.gmail.com e 465.",
  tempo_esgotado:
    "O servidor de e-mail não respondeu em 10 segundos. Confira SMTP_HOST e SMTP_PORT (para Gmail: smtp.gmail.com e 465).",
  destinatario: "O servidor de e-mail recusou o destinatário. Confira o e-mail do administrador.",
  desconhecido: "Falha inesperada. O detalhe abaixo é a resposta do servidor de e-mail.",
};

adminSettingsRouter.get("/email", (_req, res) => {
  res.json(describeEmailConfig());
});

adminSettingsRouter.post("/email/test", async (req, res) => {
  // Vai para o próprio admin logado: a rota não aceita destinatário no
  // corpo, então não serve para disparar e-mail para terceiros.
  const destino = req.admin!.email;
  try {
    await sendEmail({
      to: destino,
      subject: "Teste de envio — Inovação Store",
      html: `<p>Se este e-mail chegou, o envio da loja está funcionando: os clientes vão receber o código de verificação.</p>`,
    });
    res.json({ ok: true, to: destino });
  } catch (err) {
    const falha = classifyEmailError(err);
    console.error(`[email] teste do painel falhou (${falha.reason}): ${falha.detail}`);
    // 200 com ok:false, não 5xx: a rota funcionou, quem falhou foi o SMTP.
    // É um resultado de diagnóstico, não um erro da API.
    res.json({ ok: false, to: destino, reason: falha.reason, hint: EMAIL_HINTS[falha.reason], detail: falha.detail });
  }
});
