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

adminSettingsRouter.post("/hero-image", upload.single("image"), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Nenhuma imagem enviada." });
    return;
  }

  const current = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (current?.heroImageUrl) await deleteUpload(current.heroImageUrl);

  const url = await saveUpload(file.buffer, randomUploadName(file.mimetype), file.mimetype);
  const settings = await prisma.siteSettings.update({
    where: { id: "singleton" },
    data: { heroImageUrl: url },
  });
  res.status(201).json(settings);
});

adminSettingsRouter.delete("/hero-image", async (_req, res) => {
  const current = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (current?.heroImageUrl) await deleteUpload(current.heroImageUrl);

  const settings = await prisma.siteSettings.update({
    where: { id: "singleton" },
    data: { heroImageUrl: null },
  });
  res.json(settings);
});
