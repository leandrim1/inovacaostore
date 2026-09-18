import { Router } from "express";
import { validateCoupon } from "../coupons.js";
import { CUSTOMER_COOKIE_NAME, verifyCustomerToken } from "../customerAuth.js";

export const couponsRouter = Router();

couponsRouter.post("/validate", async (req, res) => {
  const code = String(req.body?.code ?? "");
  // Identificação opcional: cupom pode ser aplicado no carrinho antes do
  // login, então o limite por cliente só é conferido aqui quando já existe
  // sessão — a criação do pedido (sempre autenticada) é quem garante essa
  // regra de verdade.
  const token = req.cookies?.[CUSTOMER_COOKIE_NAME];
  const payload = token ? verifyCustomerToken(token) : null;

  const result = await validateCoupon(code, payload?.sub);
  if (!result.ok) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json(result.coupon);
});
