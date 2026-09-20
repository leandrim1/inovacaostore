import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";
import { CUSTOMER_COOKIE_NAME, verifyCustomerToken, type CustomerTokenPayload } from "../customerAuth.js";
import { isSessionRevoked } from "../tokens.js";
import type { Customer } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      customer?: CustomerTokenPayload;
      customerRecord?: Customer;
    }
  }
}

/**
 * Resolve a sessão do cliente a partir do cookie, conferindo no banco que a
 * conta ainda existe e que a sessão não foi revogada (troca de senha). O
 * token sozinho nunca basta.
 */
async function resolveCustomer(req: Request): Promise<Customer | null> {
  const token = req.cookies?.[CUSTOMER_COOKIE_NAME];
  const payload = token ? verifyCustomerToken(token) : null;
  if (!payload) return null;

  const customer = await prisma.customer.findUnique({ where: { id: payload.sub } });
  if (!customer || isSessionRevoked(payload.iat, customer.sessionsValidFrom)) return null;

  req.customer = {
    sub: customer.id,
    name: customer.name,
    email: customer.email,
    emailVerified: customer.emailVerified,
  };
  req.customerRecord = customer;
  return customer;
}

/** Exige apenas uma sessão válida (identidade), sem checar e-mail verificado. */
export async function requireCustomerAuth(req: Request, res: Response, next: NextFunction) {
  const customer = await resolveCustomer(req);
  if (!customer) {
    res.status(401).json({ error: "Você precisa estar logado para continuar." });
    return;
  }
  next();
}

/**
 * Exige sessão válida E e-mail verificado, checando o estado real no banco
 * (nunca confiando apenas na claim do token, que pode estar desatualizada).
 * Usado para proteger o checkout — a ação mais sensível do sistema.
 */
export async function requireVerifiedCustomer(req: Request, res: Response, next: NextFunction) {
  const customer = await resolveCustomer(req);
  if (!customer) {
    res.status(401).json({ error: "Você precisa estar logado para realizar uma compra." });
    return;
  }
  if (!customer.emailVerified) {
    res.status(403).json({ error: "Você precisa confirmar seu e-mail antes de continuar." });
    return;
  }
  next();
}

/**
 * Sessão OPCIONAL: preenche req.customer quando houver login válido e segue
 * adiante quando não houver. Usado em rotas públicas que se comportam de
 * forma diferente para quem está logado (validação de cupom, elegibilidade
 * para depoimento).
 */
export async function attachCustomerIfPresent(req: Request, _res: Response, next: NextFunction) {
  await resolveCustomer(req).catch(() => null);
  next();
}
