import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";

export const adminCouponsRouter = Router();

const couponSchema = z.object({
  code: z
    .string()
    .min(1)
    .transform((v) => v.trim().toUpperCase()),
  description: z.string().default(""),
  percentOff: z.number().min(0).max(100),
  active: z.boolean().default(true),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  maxRedemptions: z.number().int().min(1).nullable().optional(),
  maxRedemptionsPerCustomer: z.number().int().min(1).nullable().optional(),
});

// Igual ao schema de criação, mas sem "code" — o código é definido uma vez
// na criação e não muda depois, para não invalidar o histórico de uso já
// registrado nos pedidos (Order.couponCode guarda o código como snapshot,
// não uma referência ao Coupon).
const updateCouponSchema = couponSchema.omit({ code: true }).partial();

function serializeCoupon(coupon: Awaited<ReturnType<typeof prisma.coupon.findFirstOrThrow>>) {
  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    percentOff: coupon.percentOff,
    active: coupon.active,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
    maxRedemptions: coupon.maxRedemptions,
    maxRedemptionsPerCustomer: coupon.maxRedemptionsPerCustomer,
    usedCount: coupon.usedCount,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}

adminCouponsRouter.get("/", async (_req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ items: coupons.map(serializeCoupon) });
});

adminCouponsRouter.get("/:id", async (req, res) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!coupon) {
    res.status(404).json({ error: "Cupom não encontrado." });
    return;
  }
  res.json(serializeCoupon(coupon));
});

adminCouponsRouter.post("/", async (req, res) => {
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  if (data.startsAt && data.expiresAt && new Date(data.expiresAt) <= new Date(data.startsAt)) {
    res.status(400).json({ error: "A data de término deve ser depois da data de início." });
    return;
  }

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        description: data.description,
        percentOff: data.percentOff,
        active: data.active,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        maxRedemptions: data.maxRedemptions ?? null,
        maxRedemptionsPerCustomer: data.maxRedemptionsPerCustomer ?? null,
      },
    });
    res.status(201).json(serializeCoupon(coupon));
  } catch (err) {
    handleError(err, res);
  }
});

adminCouponsRouter.patch("/:id", async (req, res) => {
  const parsed = updateCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  if (data.startsAt && data.expiresAt && new Date(data.expiresAt) <= new Date(data.startsAt)) {
    res.status(400).json({ error: "A data de término deve ser depois da data de início." });
    return;
  }

  try {
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.percentOff !== undefined ? { percentOff: data.percentOff } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.startsAt !== undefined ? { startsAt: data.startsAt ? new Date(data.startsAt) : null } : {}),
        ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null } : {}),
        ...(data.maxRedemptions !== undefined ? { maxRedemptions: data.maxRedemptions } : {}),
        ...(data.maxRedemptionsPerCustomer !== undefined
          ? { maxRedemptionsPerCustomer: data.maxRedemptionsPerCustomer }
          : {}),
      },
    });
    res.json(serializeCoupon(coupon));
  } catch (err) {
    handleError(err, res);
  }
});

adminCouponsRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    handleError(err, res);
  }
});

function handleError(err: unknown, res: import("express").Response) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({ error: "Cupom não encontrado." });
      return;
    }
    if (err.code === "P2002") {
      res.status(409).json({ error: "Já existe um cupom com esse código." });
      return;
    }
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
}
