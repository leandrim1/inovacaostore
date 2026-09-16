import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { isValidCep, quoteShipping } from "../shipping.js";
import { findCoupon } from "../coupons.js";

export const ordersRouter = Router();

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
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
  shippingLabel: z.enum(["economico", "expresso"]),
});

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

ordersRouter.post("/", async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados do pedido inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  if (!isValidCep(data.address.cep)) {
    res.status(400).json({ error: "CEP inválido." });
    return;
  }
  const shippingOptions = quoteShipping(data.address.cep);
  const shippingOption = shippingOptions?.find((o) => o.id === data.shippingLabel);
  if (!shippingOption) {
    res.status(400).json({ error: "Opção de frete inválida." });
    return;
  }

  let coupon: ReturnType<typeof findCoupon> = undefined;
  if (data.couponCode) {
    coupon = findCoupon(data.couponCode);
    if (!coupon) {
      res.status(400).json({ error: "Cupom inválido ou expirado." });
      return;
    }
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const itemsData: {
        variantId: string;
        productName: string;
        color: string;
        size: string;
        price: number;
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

        const price = variant.product.price;
        subtotal += price * item.quantity;
        itemsData.push({
          variantId: variant.id,
          productName: variant.product.name,
          color: variant.color,
          size: variant.size,
          price,
          quantity: item.quantity,
        });
      }

      const discount = coupon ? Math.round(subtotal * (coupon.percentOff / 100) * 100) / 100 : 0;
      const total = Math.max(0, subtotal - discount) + shippingOption.price;

      let customer = await tx.customer.findFirst({ where: { email: data.customer.email.toLowerCase() } });
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: data.customer.name,
            email: data.customer.email.toLowerCase(),
            phone: data.customer.phone,
          },
        });
      }

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: customer.id,
          subtotal,
          discount,
          couponCode: coupon?.code,
          shippingPrice: shippingOption.price,
          shippingLabel: shippingOption.label,
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
    // SQLite permite apenas um gravador por vez: sob concorrência alta o
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
