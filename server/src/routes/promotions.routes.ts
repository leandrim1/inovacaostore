import { Router } from "express";
import { prisma } from "../db.js";
import { isDiscountingNow, toActivePromotion } from "../promotions.js";

export const promotionsRouter = Router();

/**
 * Promoções visíveis na home. Além de `active` e da data de término, agora
 * respeita também a data de início: anunciar "20% OFF" antes de o desconto
 * valer seria prometer ao cliente um preço que a loja ainda não pratica.
 */
promotionsRouter.get("/", async (_req, res) => {
  const now = new Date();
  const promotions = await prisma.promotion.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    include: { products: { select: { productId: true } }, category: { select: { slug: true, name: true } } },
    orderBy: { order: "asc" },
  });

  res.json({
    items: promotions.map((p) => ({
      id: p.id,
      title: p.title,
      highlight: p.highlight,
      description: p.description,
      ctaLabel: p.ctaLabel,
      ctaUrl: p.ctaUrl,
      imageUrl: p.imageUrl,
      desktopSettings: p.desktopSettings,
      mobileSettings: p.mobileSettings,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      active: p.active,
      order: p.order,
      discountType: p.discountType,
      discountValue: p.discountValue,
      discountScope: p.discountScope,
      category: p.category,
      // Diz se esta promoção está de fato mexendo em preço ou se é só banner.
      discounting: isDiscountingNow(toActivePromotion(p), now),
    })),
  });
});
