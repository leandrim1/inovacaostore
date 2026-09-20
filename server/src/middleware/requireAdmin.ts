import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";
import { ADMIN_COOKIE_NAME, verifyAdminToken, type AdminTokenPayload } from "../auth.js";
import { isSessionRevoked } from "../tokens.js";

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

/**
 * Porta de entrada de TODO o painel administrativo.
 *
 * Três camadas, nessa ordem — cada uma cobre uma falha diferente:
 *
 * 1. Assinatura com a chave exclusiva de admin (ver server/src/tokens.ts).
 *    Antes, admin e cliente compartilhavam a mesma chave e este middleware
 *    confiava no payload: copiar o cookie `customer_session` para
 *    `admin_session` dava acesso administrativo total a qualquer cliente
 *    cadastrado.
 * 2. O administrador precisa EXISTIR no banco agora. Um token de uma conta
 *    já removida deixa de valer na hora, sem esperar a expiração.
 * 3. A sessão não pode ter sido revogada (troca de senha, logout de todos os
 *    dispositivos).
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  const payload = token ? verifyAdminToken(token) : null;

  if (!payload) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, sessionsValidFrom: true },
  });

  if (!admin || isSessionRevoked(payload.iat, admin.sessionsValidFrom)) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  // Nome e e-mail vêm do banco, não do token: se forem alterados, o painel
  // reflete o valor atual em vez do que estava congelado na sessão.
  req.admin = { sub: admin.id, name: admin.name, email: admin.email };
  next();
}
