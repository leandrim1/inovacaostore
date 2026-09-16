import { Router } from "express";
import { isValidCep, quoteShipping } from "../shipping.js";

export const shippingRouter = Router();

shippingRouter.get("/quote", (req, res) => {
  const cep = String(req.query.cep ?? "");
  if (!isValidCep(cep)) {
    res.status(400).json({ error: "CEP inválido." });
    return;
  }
  const options = quoteShipping(cep);
  res.json({ cep, options });
});
