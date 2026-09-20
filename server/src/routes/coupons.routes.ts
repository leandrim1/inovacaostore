import { Router } from "express";
import { validateCoupon } from "../coupons.js";
import { attachCustomerIfPresent } from "../middleware/requireCustomer.js";
import { publicWriteLimiter } from "../security.js";

export const couponsRouter = Router();

couponsRouter.post("/validate", publicWriteLimiter, attachCustomerIfPresent, async (req, res) => {
  const code = String(req.body?.code ?? "");
  // Identificação opcional: cupom pode ser aplicado no carrinho antes do
  // login, então o limite por cliente só é conferido aqui quando já existe
  // sessão — a criação do pedido (sempre autenticada) é quem garante essa
  // regra de verdade.
  const result = await validateCoupon(code, req.customer?.sub);
  if (!result.ok) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json(result.coupon);
});
