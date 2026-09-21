import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { loadActivePromotions, priceProduct, serializePromotionRef } from "../promotions.js";
import { publicWriteLimiter } from "../security.js";

export const pricingRouter = Router();

const quoteSchema = z.object({
  items: z
    .array(z.object({ variantId: z.string().min(1), quantity: z.number().int().positive().max(999) }))
    .max(100),
});

/**
 * Preço atual dos itens do carrinho.
 *
 * O carrinho guarda o preço no navegador quando o item é adicionado. Se uma
 * promoção começa, muda ou expira nesse meio-tempo, aquele número envelhece —
 * e o cliente veria na tela um valor diferente do que o servidor vai cobrar.
 * Este endpoint usa exatamente o mesmo motor da criação do pedido, então o
 * carrinho mostra sempre o preço real.
 */
pricingRouter.post("/quote", publicWriteLimiter, async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Itens inválidos.", details: parsed.error.flatten() });
    return;
  }

  const { items } = parsed.data;
  if (items.length === 0) {
    res.json({ items: [], grossSubtotal: 0, promotionDiscount: 0, subtotal: 0 });
    return;
  }

  const [variants, promotions] = await Promise.all([
    prisma.productVariant.findMany({
      where: { id: { in: items.map((i) => i.variantId) } },
      include: { product: true },
    }),
    loadActivePromotions(),
  ]);

  const porId = new Map(variants.map((v) => [v.id, v]));

  let grossSubtotal = 0;
  let promotionDiscount = 0;

  const resultado = items.map((item) => {
    const variant = porId.get(item.variantId);
    // Produto sumiu ou foi desativado: devolvemos `available: false` em vez
    // de um preço, para o carrinho conseguir avisar em vez de inventar valor.
    if (!variant || !variant.product.active) {
      return { variantId: item.variantId, available: false as const };
    }

    const pricing = priceProduct(variant.product, promotions);
    grossSubtotal += pricing.originalPrice * item.quantity;
    promotionDiscount += pricing.discountAmount * item.quantity;

    return {
      variantId: item.variantId,
      available: true as const,
      price: pricing.price,
      originalPrice: pricing.originalPrice,
      percentOff: pricing.percentOff,
      stock: variant.stock,
      promotion: pricing.promotion ? serializePromotionRef(pricing.promotion) : null,
    };
  });

  const round2 = (v: number) => Math.round(v * 100) / 100;
  res.json({
    items: resultado,
    grossSubtotal: round2(grossSubtotal),
    promotionDiscount: round2(promotionDiscount),
    subtotal: round2(grossSubtotal - promotionDiscount),
  });
});
