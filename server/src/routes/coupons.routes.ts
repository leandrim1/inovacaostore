import { Router } from "express";
import { findCoupon } from "../coupons.js";

export const couponsRouter = Router();

couponsRouter.post("/validate", (req, res) => {
  const code = String(req.body?.code ?? "");
  const coupon = findCoupon(code);
  if (!coupon) {
    res.status(404).json({ error: "Cupom inválido ou expirado." });
    return;
  }
  res.json({ code: coupon.code, description: coupon.description, percentOff: coupon.percentOff });
});
