import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { serializeProduct } from "../utils/serialize.js";
import { loadActivePromotions } from "../promotions.js";

export const productsRouter = Router();

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return [value];
  return [];
}

const numericParam = z
  .string()
  .refine((v) => v.trim() !== "" && Number.isFinite(Number(v)), "Deve ser numérico.")
  .transform(Number)
  .optional();

const querySchema = z.object({
  category: z.unknown().optional(),
  size: z.unknown().optional(),
  color: z.unknown().optional(),
  minPrice: numericParam,
  maxPrice: numericParam,
  sort: z.enum(["relevancia", "menor-preco", "maior-preco", "avaliacao"]).optional(),
  q: z.string().optional(),
  featured: z.string().optional(),
  limit: z
    .string()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, "Deve ser um inteiro positivo.")
    .transform(Number)
    .pipe(z.number().max(100))
    .optional(),
});

productsRouter.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Parâmetros de busca inválidos.", details: parsed.error.flatten() });
    return;
  }
  const { category, size, color, minPrice, maxPrice, sort, q, featured, limit } = parsed.data;

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
  if (minPrice !== undefined) where.price = { ...(where.price as object), gte: minPrice };
  if (maxPrice !== undefined) where.price = { ...(where.price as object), lte: maxPrice };
  if (featured === "true") where.featured = true;
  if (q && q.trim()) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "menor-preco") orderBy = { price: "asc" };
  if (sort === "maior-preco") orderBy = { price: "desc" };
  if (sort === "avaliacao") orderBy = { rating: "desc" };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: limit,
    include: { images: { orderBy: { order: "asc" } }, variants: true, category: true },
  });

  // Uma consulta só de promoções para a listagem inteira.
  const promotions = await loadActivePromotions();
  res.json({ items: products.map((p) => serializeProduct(p, promotions)) });
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

  const promotions = await loadActivePromotions();
  res.json(serializeProduct(product, promotions));
});
