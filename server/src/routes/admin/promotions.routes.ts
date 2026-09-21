import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";
import { upload, saveValidatedImage } from "../../upload.js";
import { deleteUpload } from "../../storage.js";
import { imageSettingsSchema } from "../../imageSettings.js";
import { DISCOUNT_SCOPES, DISCOUNT_TYPES, findConflictingPromotion } from "../../promotions.js";

export const adminPromotionsRouter = Router();

const promotionSchema = z.object({
  title: z.string().min(1),
  highlight: z.string().min(1),
  description: z.string().default(""),
  ctaLabel: z.string().min(1).default("Compre agora"),
  ctaUrl: z.string().min(1).default("/"),
  desktopSettings: imageSettingsSchema.nullable().optional(),
  mobileSettings: imageSettingsSchema.nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
  discountType: z.enum(DISCOUNT_TYPES as [string, ...string[]]).default("percent"),
  discountValue: z.number().min(0).max(1_000_000).default(0),
  discountScope: z.enum(DISCOUNT_SCOPES as [string, ...string[]]).default("all"),
  categoryId: z.string().nullable().optional(),
  productIds: z.array(z.string().min(1)).max(500).optional(),
});

const updatePromotionSchema = promotionSchema.partial();

const promotionInclude = {
  products: { select: { productId: true } },
  category: { select: { id: true, slug: true, name: true } },
} as const;

type PromotionComDescontoRow = {
  products: { productId: string }[];
  [key: string]: unknown;
};

/** Achata a tabela de ligação em `productIds` — o formulário só quer os ids. */
function serializePromotion(promotion: PromotionComDescontoRow) {
  const { products, ...resto } = promotion;
  return { ...resto, productIds: products.map((p) => p.productId) };
}

class ValidationError extends Error {}

/**
 * Regras do desconto, checadas antes de gravar. Vale para criação e edição,
 * por isso recebe o estado FINAL da promoção (atual + alterações), nunca só o
 * que veio no corpo da requisição.
 */
async function validarDesconto(final: {
  id?: string;
  active: boolean;
  discountType: string;
  discountValue: number;
  discountScope: string;
  categoryId: string | null;
  productIds: string[];
  startsAt: Date | null;
  endsAt: Date | null;
}) {
  if (final.startsAt && final.endsAt && final.startsAt.getTime() >= final.endsAt.getTime()) {
    throw new ValidationError("A data de início precisa ser anterior à data de término.");
  }

  if (final.discountValue > 0) {
    if (final.discountType === "percent" && final.discountValue > 90) {
      throw new ValidationError("O desconto percentual não pode passar de 90%.");
    }
    if (final.discountScope === "category") {
      if (!final.categoryId) throw new ValidationError("Escolha a categoria que vai receber o desconto.");
      const existe = await prisma.category.count({ where: { id: final.categoryId } });
      if (!existe) throw new ValidationError("Categoria não encontrada.");
    }
    if (final.discountScope === "products" && final.productIds.length === 0) {
      throw new ValidationError("Escolha pelo menos um produto para receber o desconto.");
    }
  }

  if (final.productIds.length > 0) {
    const encontrados = await prisma.product.count({ where: { id: { in: final.productIds } } });
    if (encontrados !== final.productIds.length) {
      throw new ValidationError("Um ou mais produtos selecionados não existem mais.");
    }
  }

  // Nunca somar dois descontos: em vez de escolher um vencedor na hora da
  // venda, o cadastro conflitante é barrado aqui.
  const conflito = await findConflictingPromotion(final);
  if (conflito) {
    throw new ValidationError(
      `A promoção "${conflito.title}" já aplica desconto nos mesmos produtos nesse período. ` +
        "Ajuste as datas, o alcance, ou desative a outra promoção.",
    );
  }
}

adminPromotionsRouter.get("/", async (_req, res) => {
  const promotions = await prisma.promotion.findMany({
    include: promotionInclude,
    orderBy: { order: "asc" },
  });
  res.json({ items: promotions.map(serializePromotion) });
});

adminPromotionsRouter.get("/:id", async (req, res) => {
  const promotion = await prisma.promotion.findUnique({
    where: { id: req.params.id },
    include: promotionInclude,
  });
  if (!promotion) {
    res.status(404).json({ error: "Promoção não encontrada." });
    return;
  }
  res.json(serializePromotion(promotion));
});

adminPromotionsRouter.post("/", async (req, res) => {
  const parsed = promotionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const productIds = [...new Set(data.productIds ?? [])];
  const categoryId = data.discountScope === "category" ? (data.categoryId ?? null) : null;
  const startsAt = data.startsAt ? new Date(data.startsAt) : null;
  const endsAt = data.endsAt ? new Date(data.endsAt) : null;

  try {
    await validarDesconto({
      active: data.active,
      discountType: data.discountType,
      discountValue: data.discountValue,
      discountScope: data.discountScope,
      categoryId,
      productIds,
      startsAt,
      endsAt,
    });

    const promotion = await prisma.promotion.create({
      data: {
        title: data.title,
        highlight: data.highlight,
        description: data.description,
        ctaLabel: data.ctaLabel,
        ctaUrl: data.ctaUrl,
        startsAt,
        endsAt,
        active: data.active,
        order: data.order,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountScope: data.discountScope,
        categoryId,
        // Só guarda a lista quando o alcance é "produtos específicos": assim
        // trocar de alcance não deixa vínculos órfãos mudando o resultado.
        ...(data.discountScope === "products" && productIds.length
          ? { products: { create: productIds.map((productId) => ({ productId })) } }
          : {}),
      },
      include: promotionInclude,
    });
    res.status(201).json(serializePromotion(promotion));
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
    const atual = await prisma.promotion.findUnique({
      where: { id: req.params.id },
      include: { products: { select: { productId: true } } },
    });
    if (!atual) {
      res.status(404).json({ error: "Promoção não encontrada." });
      return;
    }

    // O estado FINAL é o que vale para as regras: uma edição que só mexe na
    // data ainda precisa ser conferida contra o alcance que já estava salvo.
    const discountScope = data.discountScope ?? atual.discountScope;
    const discountType = data.discountType ?? atual.discountType;
    const discountValue = data.discountValue ?? atual.discountValue;
    const active = data.active ?? atual.active;
    const startsAt =
      data.startsAt !== undefined ? (data.startsAt ? new Date(data.startsAt) : null) : atual.startsAt;
    const endsAt =
      data.endsAt !== undefined ? (data.endsAt ? new Date(data.endsAt) : null) : atual.endsAt;
    const categoryIdFinal =
      discountScope === "category"
        ? (data.categoryId !== undefined ? data.categoryId : atual.categoryId) ?? null
        : null;
    const productIdsFinal =
      discountScope === "products"
        ? [...new Set(data.productIds ?? atual.products.map((p) => p.productId))]
        : [];

    await validarDesconto({
      id: atual.id,
      active,
      discountType,
      discountValue,
      discountScope,
      categoryId: categoryIdFinal,
      productIds: productIdsFinal,
      startsAt,
      endsAt,
    });

    const mexeuNoDesconto =
      data.discountScope !== undefined ||
      data.productIds !== undefined ||
      data.categoryId !== undefined ||
      data.discountValue !== undefined ||
      data.discountType !== undefined;

    const promotion = await prisma.promotion.update({
      where: { id: req.params.id },
      data: {
        ...(mexeuNoDesconto
          ? {
              discountType,
              discountValue,
              discountScope,
              categoryId: categoryIdFinal,
              products: { deleteMany: {}, create: productIdsFinal.map((productId) => ({ productId })) },
            }
          : {}),
        ...(data.startsAt !== undefined ? { startsAt } : {}),
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
      include: promotionInclude,
    });
    res.json(serializePromotion(promotion));
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
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    res.status(404).json({ error: "Promoção não encontrada." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
}
