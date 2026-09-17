import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";
import { CUSTOMER_COOKIE_NAME, verifyCustomerToken, type CustomerTokenPayload } from "../customerAuth.js";
import type { Customer } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      customer?: CustomerTokenPayload;
      customerRecord?: Customer;
    }
  }
}

/** Exige apenas uma sessão válida (identidade), sem checar e-mail verificado. */
export function requireCustomerAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[CUSTOMER_COOKIE_NAME];
  const payload = token ? verifyCustomerToken(token) : null;

  if (!payload) {
    res.status(401).json({ error: "Você precisa estar logado para continuar." });
    return;
  }

  req.customer = payload;
  next();
}

/**
 * Exige sessão válida E e-mail verificado, checando o estado real no banco
 * (nunca confiando apenas na claim do token, que pode estar desatualizada).
 * Usado para proteger o checkout — a ação mais sensível do sistema.
 */
export async function requireVerifiedCustomer(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[CUSTOMER_COOKIE_NAME];
  const payload = token ? verifyCustomerToken(token) : null;

  if (!payload) {
    res.status(401).json({ error: "Você precisa estar logado para realizar uma compra." });
    return;
  }

  const customer = await prisma.customer.findUnique({ where: { id: payload.sub } });
  if (!customer) {
    res.status(401).json({ error: "Você precisa estar logado para realizar uma compra." });
    return;
  }
  if (!customer.emailVerified) {
    res.status(403).json({ error: "Você precisa confirmar seu e-mail antes de continuar." });
    return;
  }

  req.customer = payload;
  req.customerRecord = customer;
  next();
}
