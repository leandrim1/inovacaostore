import { Router } from "express";
import { z } from "zod";
import { calculateShipping } from "../shipping.js";

import { publicWriteLimiter } from "../security.js";

export const shippingRouter = Router();

const quoteSchema = z.object({
  cep: z.string().min(1),
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().positive() })).default([]),
});

const ERROR_MESSAGES: Record<string, string> = {
  invalid_cep: "CEP inválido.",
  cep_not_found: "CEP não encontrado.",
  service_unavailable: "Não foi possível calcular o frete no momento. Tente novamente em instantes.",
  no_coverage: "Não entregamos nesse destino no momento.",
  no_items: "Informe ao menos um item para calcular o frete.",
};

shippingRouter.post("/quote", publicWriteLimiter, async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }

  const outcome = await calculateShipping(parsed.data);
  if (!outcome.ok) {
    const status = outcome.reason === "service_unavailable" ? 503 : 400;
    res.status(status).json({ error: ERROR_MESSAGES[outcome.reason], reason: outcome.reason });
    return;
  }

  res.json(outcome.quote);
});
