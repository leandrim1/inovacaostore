import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";
import { serializeProduct } from "../../utils/serialize.js";
import { uniqueSlug } from "../../utils/slug.js";
import { upload, randomUploadName } from "../../upload.js";
import { saveUpload, deleteUpload } from "../../storage.js";

export const adminProductsRouter = Router();

const variantSchema = z.object({
  id: z.string().optional(),
  color: z.string().min(1),
  colorHex: z.string().min(1),
  size: z.string().min(1),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().default(""),
  features: z.array(z.string()).default([]),
  tags: z.array(z.enum(["novo", "mais-vendido", "importado", "ultimas-unidades"])).default([]),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable().optional(),
  sku: z.string().min(1),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  categoryId: z.string().min(1),
  variants: z.array(variantSchema).min(1, "Informe ao menos uma variação (cor, tamanho e estoque)."),
});

const updateProductSchema = productSchema.partial();

const include = { images: { orderBy: { order: "asc" as const } }, variants: true, category: true };

adminProductsRouter.get("/", async (req, res) => {
  const { q, categoryId, active } = req.query;
  const where: Prisma.ProductWhereInput = {};
  if (typeof categoryId === "string") where.categoryId = categoryId;
  if (active === "true") where.active = true;
  if (active === "false") where.active = false;
  if (typeof q === "string" && q.trim()) {
    where.OR = [{ name: { contains: q } }, { sku: { contains: q } }];
  }

  const products = await prisma.product.findMany({
    where,
    include,
    orderBy: { createdAt: "desc" },
  });
  res.json({ items: products.map(serializeProduct) });
});

adminProductsRouter.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id }, include });
  if (!product) {
    res.status(404).json({ error: "Produto não encontrado." });
    return;
  }
  res.json(serializeProduct(product));
});

adminProductsRouter.post("/", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  try {
    const slug = data.slug?.trim()
      ? data.slug.trim()
      : await uniqueSlug(data.name, async (s) => Boolean(await prisma.product.findUnique({ where: { slug: s } })));

    const product = await prisma.product.create({
      data: {
        slug,
        name: data.name,
        description: data.description,
        features: JSON.stringify(data.features),
        tags: JSON.stringify(data.tags),
        price: data.price,
        compareAtPrice: data.compareAtPrice ?? null,
        sku: data.sku,
        featured: data.featured,
        active: data.active,
        categoryId: data.categoryId,
        variants: {
          create: data.variants.map((v) => ({
            color: v.color,
            colorHex: v.colorHex,
            size: v.size,
            stock: v.stock,
            sku: v.sku,
          })),
        },
      },
      include,
    });

    res.status(201).json(serializeProduct(product));
  } catch (err) {
    handlePrismaError(err, res, "produto");
  }
});

adminProductsRouter.patch("/:id", async (req, res) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const productId = req.params.id;

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) {
    res.status(404).json({ error: "Produto não encontrado." });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.features !== undefined ? { features: JSON.stringify(data.features) } : {}),
          ...(data.tags !== undefined ? { tags: JSON.stringify(data.tags) } : {}),
          ...(data.price !== undefined ? { price: data.price } : {}),
          ...(data.compareAtPrice !== undefined ? { compareAtPrice: data.compareAtPrice } : {}),
          ...(data.sku !== undefined ? { sku: data.sku } : {}),
          ...(data.featured !== undefined ? { featured: data.featured } : {}),
          ...(data.active !== undefined ? { active: data.active } : {}),
          ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        },
      });

      if (data.variants) {
        const currentVariants = await tx.productVariant.findMany({ where: { productId } });
        const currentById = new Map(currentVariants.map((v) => [v.id, v]));
        const keptIds = new Set<string>();

        for (const v of data.variants) {
          // Variações existentes são casadas pelo `id` (estável mesmo se
          // cor/tamanho forem renomeados); só variações realmente novas
          // (sem `id`, ou com um `id` que não pertence a este produto) usam
          // a chave natural cor+tamanho como fallback para evitar duplicatas.
          const existingById = v.id ? currentById.get(v.id) : undefined;

          if (existingById) {
            await tx.productVariant.update({
              where: { id: existingById.id },
              data: { color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock, sku: v.sku },
            });
            keptIds.add(existingById.id);
            continue;
          }

          const upserted = await tx.productVariant.upsert({
            where: { productId_color_size: { productId, color: v.color, size: v.size } },
            update: { colorHex: v.colorHex, stock: v.stock, sku: v.sku },
            create: {
              productId,
              color: v.color,
              colorHex: v.colorHex,
              size: v.size,
              stock: v.stock,
              sku: v.sku,
            },
          });
          keptIds.add(upserted.id);
        }

        for (const existingVariant of currentVariants) {
          if (!keptIds.has(existingVariant.id)) {
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: { stock: 0 },
            });
          }
        }
      }
    });

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId }, include });
    res.json(serializeProduct(product));
  } catch (err) {
    handlePrismaError(err, res, "produto");
  }
});

adminProductsRouter.delete("/:id", async (req, res) => {
  try {
    const product = await prisma.product.delete({
      where: { id: req.params.id },
      include: { images: true },
    });
    await Promise.all(product.images.map((image) => deleteUpload(image.url)));
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      res.status(409).json({
        error:
          "Não é possível excluir este produto pois já existem pedidos associados a ele. Oculte o produto em vez de excluí-lo.",
      });
      return;
    }
    handlePrismaError(err, res, "produto");
  }
});

adminProductsRouter.post("/:id/images", upload.array("images", 8), async (req, res) => {
  const productId = req.params.id;
  const files = (req.files as Express.Multer.File[]) ?? [];

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    // Com multer em memória, nada é gravado em disco/Blob até chamarmos
    // saveUpload abaixo — então não há arquivo órfão a limpar aqui.
    res.status(404).json({ error: "Produto não encontrado." });
    return;
  }

  if (files.length === 0) {
    res.status(400).json({ error: "Nenhuma imagem enviada." });
    return;
  }

  const currentCount = await prisma.productImage.count({ where: { productId } });
  const urls = await Promise.all(
    files.map((file) => saveUpload(file.buffer, randomUploadName(file.mimetype), file.mimetype)),
  );

  await prisma.productImage.createMany({
    data: urls.map((url, i) => ({
      productId,
      url,
      order: currentCount + i,
    })),
  });

  const updated = await prisma.product.findUniqueOrThrow({ where: { id: productId }, include });
  res.status(201).json(serializeProduct(updated));
});

adminProductsRouter.delete("/:id/images/:imageId", async (req, res) => {
  const { id: productId, imageId } = req.params;
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
  if (!image) {
    res.status(404).json({ error: "Imagem não encontrada." });
    return;
  }

  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteUpload(image.url);

  const updated = await prisma.product.findUniqueOrThrow({ where: { id: productId }, include });
  res.json(serializeProduct(updated));
});

function handlePrismaError(err: unknown, res: import("express").Response, label: string) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "campo único";
      res.status(409).json({ error: `Já existe um ${label} com esse ${target}.` });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: `${label} não encontrado.` });
      return;
    }
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
}
