import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db.js";
import { upload, randomUploadName } from "../../upload.js";
import { saveUpload, deleteUpload } from "../../storage.js";

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
  const data = parsed.data;

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
    files.map((file) => saveUpload(file.buffer, randomUploadName(file.mimetype), file.mimetype)),
  );
  await prisma.heroImage.createMany({
    data: urls.map((url, i) => ({ url, order: currentCount + i })),
  });

  const heroImages = await prisma.heroImage.findMany({ orderBy: { order: "asc" } });
  res.status(201).json({ items: heroImages });
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
