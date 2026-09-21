import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";
import { upload, saveValidatedImage } from "../../upload.js";
import { deleteUpload } from "../../storage.js";
import { imageSettingsPatchSchema } from "../../imageSettings.js";

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
