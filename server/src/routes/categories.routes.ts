import { Router } from "express";
import { prisma } from "../db.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  res.json(
    categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
    })),
  );
});
