import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";
import { upload, saveValidatedImage } from "../../upload.js";
import { deleteUpload } from "../../storage.js";
import { imageSettingsSchema } from "../../imageSettings.js";

export const adminPromotionsRouter = Router();

const promotionSchema = z.object({
  title: z.string().min(1),
  highlight: z.string().min(1),
  description: z.string().default(""),
  ctaLabel: z.string().min(1).default("Compre agora"),
  ctaUrl: z.string().min(1).default("/"),
  desktopSettings: imageSettingsSchema.nullable().optional(),
  mobileSettings: imageSettingsSchema.nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
});

const updatePromotionSchema = promotionSchema.partial();

adminPromotionsRouter.get("/", async (_req, res) => {
  const promotions = await prisma.promotion.findMany({ orderBy: { order: "asc" } });
  res.json({ items: promotions });
});

adminPromotionsRouter.get("/:id", async (req, res) => {
  const promotion = await prisma.promotion.findUnique({ where: { id: req.params.id } });
  if (!promotion) {
    res.status(404).json({ error: "Promoção não encontrada." });
    return;
  }
  res.json(promotion);
});

adminPromotionsRouter.post("/", async (req, res) => {
  const parsed = promotionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  try {
    const promotion = await prisma.promotion.create({
      data: {
        title: data.title,
        highlight: data.highlight,
        description: data.description,
        ctaLabel: data.ctaLabel,
        ctaUrl: data.ctaUrl,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        active: data.active,
        order: data.order,
      },
    });
    res.status(201).json(promotion);
  } catch (err) {
    handleError(err, res);
  }
});

adminPromotionsRouter.patch("/:id", async (req, res) => {
  const parsed = updatePromotionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  try {
    const promotion = await prisma.promotion.update({
      where: { id: req.params.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.highlight !== undefined ? { highlight: data.highlight } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.ctaLabel !== undefined ? { ctaLabel: data.ctaLabel } : {}),
        ...(data.ctaUrl !== undefined ? { ctaUrl: data.ctaUrl } : {}),
        ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
        ...(data.desktopSettings !== undefined
          ? { desktopSettings: data.desktopSettings ?? Prisma.DbNull }
          : {}),
        ...(data.mobileSettings !== undefined
          ? { mobileSettings: data.mobileSettings ?? Prisma.DbNull }
          : {}),
      },
    });
    res.json(promotion);
  } catch (err) {
    handleError(err, res);
  }
});

adminPromotionsRouter.delete("/:id", async (req, res) => {
  try {
    const promotion = await prisma.promotion.delete({ where: { id: req.params.id } });
    if (promotion.imageUrl) await deleteUpload(promotion.imageUrl);
    res.status(204).end();
  } catch (err) {
    handleError(err, res);
  }
});

adminPromotionsRouter.post("/:id/image", upload.single("image"), async (req, res) => {
  const promotion = await prisma.promotion.findUnique({ where: { id: req.params.id } });
  if (!promotion) {
    res.status(404).json({ error: "Promoção não encontrada." });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Nenhuma imagem enviada." });
    return;
  }

  if (promotion.imageUrl) await deleteUpload(promotion.imageUrl);

  const url = await saveValidatedImage(file.buffer);
  const updated = await prisma.promotion.update({ where: { id: req.params.id }, data: { imageUrl: url } });
  res.status(201).json(updated);
});

adminPromotionsRouter.delete("/:id/image", async (req, res) => {
  const promotion = await prisma.promotion.findUnique({ where: { id: req.params.id } });
  if (!promotion) {
    res.status(404).json({ error: "Promoção não encontrada." });
    return;
  }
  if (promotion.imageUrl) await deleteUpload(promotion.imageUrl);
  const updated = await prisma.promotion.update({ where: { id: req.params.id }, data: { imageUrl: null } });
  res.json(updated);
});

function handleError(err: unknown, res: import("express").Response) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    res.status(404).json({ error: "Promoção não encontrada." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
}
