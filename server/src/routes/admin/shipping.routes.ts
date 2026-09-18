import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db.js";

export const adminShippingRouter = Router();

const settingsSchema = z.object({
  enabled: z.boolean(),
  originLat: z.number(),
  originLng: z.number(),
  freeShippingMinOrderValue: z.number().min(0).nullable(),
  freeShippingRegions: z.array(z.object({ state: z.string().min(2).max(2), city: z.string().optional() })),
  minShippingPrice: z.number().min(0),
  freeWeightKg: z.number().min(0),
  pricePerExtraKg: z.number().min(0),
  freeVolumeM3: z.number().min(0),
  pricePerExtraM3: z.number().min(0),
  fallbackFlatPrice: z.number().min(0),
});

adminShippingRouter.get("/settings", async (_req, res) => {
  const settings = await prisma.shippingSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    res.status(404).json({ error: "Configurações de frete ainda não inicializadas." });
    return;
  }
  res.json({ ...settings, freeShippingRegions: JSON.parse(settings.freeShippingRegions) });
});

adminShippingRouter.put("/settings", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const { freeShippingRegions, ...rest } = parsed.data;
  const data = { ...rest, freeShippingRegions: JSON.stringify(freeShippingRegions) };

  const settings = await prisma.shippingSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  res.json({ ...settings, freeShippingRegions: JSON.parse(settings.freeShippingRegions) });
});

const tierSchema = z.object({
  minKm: z.number().min(0),
  maxKm: z.number().min(0).nullable(),
  price: z.number().min(0),
  etaLabel: z.string().optional(),
  order: z.number().int().default(0),
});

adminShippingRouter.get("/tiers", async (_req, res) => {
  const tiers = await prisma.shippingTier.findMany({ orderBy: { minKm: "asc" } });
  res.json({ items: tiers });
});

adminShippingRouter.post("/tiers", async (req, res) => {
  const parsed = tierSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const tier = await prisma.shippingTier.create({ data: parsed.data });
  res.status(201).json(tier);
});

adminShippingRouter.put("/tiers/:id", async (req, res) => {
  const parsed = tierSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.shippingTier.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Faixa de distância não encontrada." });
    return;
  }
  const tier = await prisma.shippingTier.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(tier);
});

adminShippingRouter.delete("/tiers/:id", async (req, res) => {
  const existing = await prisma.shippingTier.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Faixa de distância não encontrada." });
    return;
  }
  await prisma.shippingTier.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
