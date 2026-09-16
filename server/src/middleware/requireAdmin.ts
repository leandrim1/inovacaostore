import type { Request, Response, NextFunction } from "express";
import { ADMIN_COOKIE_NAME, verifyAdminToken, type AdminTokenPayload } from "../auth.js";

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  const payload = token ? verifyAdminToken(token) : null;

  if (!payload) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  req.admin = payload;
  next();
}
