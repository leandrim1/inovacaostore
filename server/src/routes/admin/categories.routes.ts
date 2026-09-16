import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";
import { uniqueSlug } from "../../utils/slug.js";

export const adminCategoriesRouter = Router();

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().default(""),
  order: z.number().int().default(0),
});

adminCategoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
  res.json(
    categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      order: c.order,
      productCount: c._count.products,
    })),
  );
});

adminCategoriesRouter.post("/", async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  try {
    const slug = data.slug?.trim()
      ? data.slug.trim()
      : await uniqueSlug(data.name, async (s) => Boolean(await prisma.category.findUnique({ where: { slug: s } })));

    const category = await prisma.category.create({
      data: { name: data.name, slug, description: data.description, order: data.order },
    });
    res.status(201).json(category);
  } catch (err) {
    handleError(err, res);
  }
});

adminCategoriesRouter.patch("/:id", async (req, res) => {
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }

  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(category);
  } catch (err) {
    handleError(err, res);
  }
});

adminCategoriesRouter.delete("/:id", async (req, res) => {
  const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (productCount > 0) {
    res.status(409).json({
      error: `Não é possível excluir: existem ${productCount} produto(s) nesta categoria. Mova-os para outra categoria primeiro.`,
    });
    return;
  }

  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    handleError(err, res);
  }
});

function handleError(err: unknown, res: import("express").Response) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "Já existe uma categoria com esse slug." });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Categoria não encontrada." });
      return;
    }
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
}
