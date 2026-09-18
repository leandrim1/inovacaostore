import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db.js";
import { ORDER_STATUSES } from "../../orderStatus.js";

export const adminOrdersRouter = Router();

adminOrdersRouter.get("/", async (req, res) => {
  const { status } = req.query;
  const orders = await prisma.order.findMany({
    where: typeof status === "string" && status ? { status } : undefined,
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ items: orders });
});

adminOrdersRouter.get("/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { customer: true, items: true },
  });
  if (!order) {
    res.status(404).json({ error: "Pedido não encontrado." });
    return;
  }
  res.json(order);
});

const statusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

adminOrdersRouter.patch("/:id", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Status inválido." });
    return;
  }

  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
      include: { customer: true, items: true },
    });
    res.json(order);
  } catch {
    res.status(404).json({ error: "Pedido não encontrado." });
  }
});
