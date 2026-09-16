import { Router } from "express";
import { prisma } from "../db.js";

export const promotionsRouter = Router();

promotionsRouter.get("/", async (_req, res) => {
  const promotions = await prisma.promotion.findMany({
    where: {
      active: true,
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    orderBy: { order: "asc" },
  });
  res.json({ items: promotions });
});
