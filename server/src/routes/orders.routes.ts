import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { calculateShipping } from "../shipping.js";
import { validateCoupon } from "../coupons.js";
import { loadActivePromotions, priceProduct } from "../promotions.js";
import { requireVerifiedCustomer } from "../middleware/requireCustomer.js";
import { publicWriteLimiter } from "../security.js";

export const ordersRouter = Router();

const orderSchema = z.object({
  customer: z.object({
    phone: z.string().min(1),
  }),
  address: z.object({
    cep: z.string().min(8),
    street: z.string().min(1),
    number: z.string().min(1),
    complement: z.string().default(""),
    neighborhood: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2).max(2),
  }),
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().positive() })).min(1),
  paymentMethod: z.enum(["pix", "cartao", "boleto"]),
  couponCode: z.string().optional(),
});

const SHIPPING_ERROR_MESSAGES: Record<string, string> = {
  invalid_cep: "CEP inválido.",
  cep_not_found: "CEP não encontrado.",
  service_unavailable: "Não foi possível calcular o frete no momento. Tente novamente em instantes.",
  no_coverage: "Não entregamos nesse destino no momento.",
  no_items: "Informe ao menos um item para calcular o frete.",
};

class OrderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function generateOrderNumber() {
  return `IS${Date.now().toString().slice(-9)}`;
}

ordersRouter.post("/", publicWriteLimiter, requireVerifiedCustomer, async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados do pedido inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  const shippingOutcome = await calculateShipping({ cep: data.address.cep, items: data.items });
  if (!shippingOutcome.ok) {
    const status = shippingOutcome.reason === "service_unavailable" ? 503 : 400;
    res.status(status).json({ error: SHIPPING_ERROR_MESSAGES[shippingOutcome.reason], reason: shippingOutcome.reason });
    return;
  }
  const shippingQuote = shippingOutcome.quote;

  let coupon: { code: string; percentOff: number; maxRedemptions: number | null } | undefined;
  if (data.couponCode) {
    const validation = await validateCoupon(data.couponCode, req.customerRecord!.id);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }
    coupon = {
      code: validation.record.code,
      percentOff: validation.record.percentOff,
      maxRedemptions: validation.record.maxRedemptions,
    };
  }

  // As promoções são lidas do banco, JAMAIS do corpo da requisição: o preço
  // final é sempre recalculado aqui, então mexer no preço pelo DevTools ou
  // por um POST forjado não muda nada — o cliente só escolhe variação e
  // quantidade.
  const promotions = await loadActivePromotions();

  try {
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let promotionDiscount = 0;
      const itemsData: {
        variantId: string;
        productName: string;
        color: string;
        size: string;
        price: number;
        originalPrice: number | null;
        promotionId: string | null;
        promotionTitle: string | null;
        unitCost: number;
        quantity: number;
      }[] = [];

      for (const item of data.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant || !variant.product.active) {
          throw new OrderError(404, "Um dos produtos do carrinho não está mais disponível.");
        }

        const decremented = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (decremented.count !== 1) {
          throw new OrderError(
            409,
            `Estoque insuficiente para "${variant.product.name}" (${variant.color}, ${variant.size}).`,
          );
        }

        const pricing = priceProduct(variant.product, promotions);
        subtotal += pricing.price * item.quantity;
        promotionDiscount += pricing.discountAmount * item.quantity;
        itemsData.push({
          variantId: variant.id,
          productName: variant.product.name,
          color: variant.color,
          size: variant.size,
          price: pricing.price,
          originalPrice: pricing.promotion ? pricing.originalPrice : null,
          promotionId: pricing.promotion?.id ?? null,
          promotionTitle: pricing.promotion?.title ?? null,
          unitCost: variant.product.costPrice,
          quantity: item.quantity,
        });
      }

      subtotal = Math.round(subtotal * 100) / 100;
      promotionDiscount = Math.round(promotionDiscount * 100) / 100;

      if (coupon) {
        // Reserva o uso do cupom de forma atômica dentro da transação —
        // mesmo padrão do decremento de estoque acima — para não deixar
        // dois pedidos concorrentes passarem ambos pela checagem prévia e
        // estourarem juntos um limite de "primeiras N vagas".
        const reserved =
          coupon.maxRedemptions != null
            ? await tx.coupon.updateMany({
                where: { code: coupon.code, usedCount: { lt: coupon.maxRedemptions } },
                data: { usedCount: { increment: 1 } },
              })
            : await tx.coupon.updateMany({ where: { code: coupon.code }, data: { usedCount: { increment: 1 } } });

        if (reserved.count !== 1) {
          throw new OrderError(409, "Este cupom já atingiu o limite de usos.");
        }
      }

      const discount = coupon ? Math.round(subtotal * (coupon.percentOff / 100) * 100) / 100 : 0;
      const total = Math.max(0, subtotal - discount) + shippingQuote.price;

      // A identidade do cliente vem exclusivamente da sessão autenticada
      // (nunca do corpo da requisição) — já validada e carregada pelo
      // middleware requireVerifiedCustomer.
      const customer = await tx.customer.update({
        where: { id: req.customerRecord!.id },
        data: { phone: data.customer.phone },
      });

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: customer.id,
          subtotal,
          promotionDiscount,
          discount,
          couponCode: coupon?.code,
          shippingPrice: shippingQuote.price,
          shippingLabel: shippingQuote.isFree
            ? "Frete grátis"
            : shippingQuote.tierLabel
              ? `Frete (${shippingQuote.tierLabel})`
              : "Frete",
          shippingDistanceKm: shippingQuote.distanceKm,
          shippingMethod: shippingQuote.method,
          total,
          paymentMethod: data.paymentMethod,
          cep: data.address.cep,
          street: data.address.street,
          number: data.address.number,
          complement: data.address.complement,
          neighborhood: data.address.neighborhood,
          city: data.address.city,
          state: data.address.state.toUpperCase(),
          items: { create: itemsData },
        },
        include: { items: true },
      });
    }, { maxWait: 15000, timeout: 15000 });

    res.status(201).json({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
    });
  } catch (err) {
    if (err instanceof OrderError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // Sob pico de concorrência (ex.: pool de conexões do banco esgotado), o
    // Prisma pode não conseguir iniciar/concluir a transação a tempo. Isso
    // não é um erro do pedido em si, então respondemos de forma clara e
    // "tentável de novo" em vez de um erro genérico de servidor.
    if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P1008" || err.code === "P2028")) {
      console.error(err);
      res.status(503).json({
        error: "O sistema está processando muitos pedidos ao mesmo tempo. Tente novamente em alguns segundos.",
      });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Não foi possível criar o pedido." });
  }
});
