import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { ADMIN_COOKIE_NAME, cookieOptions, signAdminToken } from "../auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    res.status(401).json({ error: "Credenciais inválidas." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciais inválidas." });
    return;
  }

  const token = signAdminToken({ sub: user.id, email: user.email, name: user.name });
  res.cookie(ADMIN_COOKIE_NAME, token, cookieOptions);
  res.json({ name: user.name, email: user.email });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

authRouter.get("/me", requireAdmin, (req, res) => {
  res.json({ name: req.admin!.name, email: req.admin!.email });
});
