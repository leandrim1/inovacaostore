import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { Testimonial } from "@prisma/client";
import { attachCustomerIfPresent } from "../middleware/requireCustomer.js";
import { publicWriteLimiter } from "../security.js";
import { requireVerifiedCustomer } from "../middleware/requireCustomer.js";
import { APPROVED_STATUS, DELIVERED_ORDER_STATUS, PENDING_STATUS } from "../testimonialStatus.js";

export const testimonialsRouter = Router();

/** Nunca expõe publicamente a qual cliente o depoimento pertence. */
function serializePublic(t: Testimonial) {
  return {
    id: t.id,
    name: t.name,
    city: t.city,
    rating: t.rating,
    quote: t.quote,
    featured: t.featured,
    createdAt: t.createdAt,
  };
}

testimonialsRouter.get("/", async (_req, res) => {
  const items = await prisma.testimonial.findMany({
    where: { status: APPROVED_STATUS },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  const averageRating =
    items.length > 0
      ? Math.round((items.reduce((sum, t) => sum + t.rating, 0) / items.length) * 10) / 10
      : null;

  res.json({ items: items.map(serializePublic), averageRating, count: items.length });
});

/**
 * Diz ao site se o botão "Deixe seu depoimento" deve aparecer e, quando não,
 * por quê — para o cliente entender o que falta em vez de ver um erro só
 * depois de escrever tudo. Autenticação opcional: visitante deslogado recebe
 * `nao_logado` em vez de 401.
 */
testimonialsRouter.get("/eligibility", attachCustomerIfPresent, async (req, res) => {
  const payload = req.customer;

  if (!payload) {
    res.json({ canSubmit: false, reason: "nao_logado", suggestedName: null });
    return;
  }

  const customer = await prisma.customer.findUnique({ where: { id: payload.sub } });
  if (!customer) {
    res.json({ canSubmit: false, reason: "nao_logado", suggestedName: null });
    return;
  }
  if (!customer.emailVerified) {
    res.json({ canSubmit: false, reason: "email_nao_verificado", suggestedName: customer.name });
    return;
  }

  const [deliveredOrders, existing] = await Promise.all([
    prisma.order.count({ where: { customerId: customer.id, status: DELIVERED_ORDER_STATUS } }),
    prisma.testimonial.findFirst({
      where: { customerId: customer.id, status: { in: [PENDING_STATUS, APPROVED_STATUS] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (deliveredOrders === 0) {
    res.json({ canSubmit: false, reason: "sem_pedido_entregue", suggestedName: customer.name });
    return;
  }
  if (existing) {
    res.json({
      canSubmit: false,
      reason: existing.status === APPROVED_STATUS ? "ja_publicado" : "ja_enviado",
      suggestedName: customer.name,
    });
    return;
  }

  res.json({ canSubmit: true, reason: null, suggestedName: customer.name });
});

const testimonialSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(60).optional(),
  city: z.string().trim().max(60).optional(),
  rating: z.number().int().min(1, "Dê uma nota de 1 a 5.").max(5),
  quote: z
    .string()
    .trim()
    .min(20, "Conte um pouco mais: escreva ao menos 20 caracteres.")
    .max(500, "Seu depoimento deve ter no máximo 500 caracteres."),
});

testimonialsRouter.post("/", publicWriteLimiter, requireVerifiedCustomer, async (req, res) => {
  const parsed = testimonialSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    res.status(400).json({ error: firstIssue });
    return;
  }

  const customer = req.customerRecord!;

  const deliveredOrders = await prisma.order.count({
    where: { customerId: customer.id, status: DELIVERED_ORDER_STATUS },
  });
  if (deliveredOrders === 0) {
    res.status(403).json({
      error: "Só é possível avaliar depois que um pedido seu for entregue.",
    });
    return;
  }

  const existing = await prisma.testimonial.findFirst({
    where: { customerId: customer.id, status: { in: [PENDING_STATUS, APPROVED_STATUS] } },
  });
  if (existing) {
    res.status(409).json({
      error:
        existing.status === APPROVED_STATUS
          ? "Você já tem um depoimento publicado na loja."
          : "Você já enviou um depoimento e ele está aguardando aprovação.",
    });
    return;
  }

  const data = parsed.data;
  await prisma.testimonial.create({
    data: {
      customerId: customer.id,
      name: data.name?.trim() || customer.name,
      city: data.city?.trim() ?? "",
      rating: data.rating,
      quote: data.quote.trim(),
      status: PENDING_STATUS,
    },
  });

  res.status(201).json({
    message: "Depoimento enviado! Ele aparece na loja assim que for aprovado.",
  });
});
