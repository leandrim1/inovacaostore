import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { serializeProduct } from "../utils/serialize.js";

export const productsRouter = Router();

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return [value];
  return [];
}

productsRouter.get("/", async (req, res) => {
  const { category, size, color, minPrice, maxPrice, sort, q, featured, limit } = req.query;

  const categories = toArray(category);
  const sizes = toArray(size);
  const colors = toArray(color);

  const where: Prisma.ProductWhereInput = { active: true };

  if (categories.length) {
    where.category = { slug: { in: categories } };
  }
  if (sizes.length) {
    where.variants = { ...(where.variants as object), some: { size: { in: sizes } } };
  }
  if (colors.length) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { variants: { some: { color: { in: colors } } } },
    ];
  }
  if (minPrice) where.price = { ...(where.price as object), gte: Number(minPrice) };
  if (maxPrice) where.price = { ...(where.price as object), lte: Number(maxPrice) };
  if (featured === "true") where.featured = true;
  if (q && typeof q === "string" && q.trim()) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
    ];
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "menor-preco") orderBy = { price: "asc" };
  if (sort === "maior-preco") orderBy = { price: "desc" };
  if (sort === "avaliacao") orderBy = { rating: "desc" };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: limit ? Number(limit) : undefined,
    include: { images: { orderBy: { order: "asc" } }, variants: true, category: true },
  });

  res.json({ items: products.map(serializeProduct) });
});

productsRouter.get("/:slug", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { images: { orderBy: { order: "asc" } }, variants: true, category: true },
  });

  if (!product || !product.active) {
    res.status(404).json({ error: "Produto não encontrado." });
    return;
  }

  res.json(serializeProduct(product));
});
