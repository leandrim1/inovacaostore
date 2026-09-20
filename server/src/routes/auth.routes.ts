import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { ADMIN_COOKIE_NAME, cookieOptions, signAdminToken } from "../auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { accountActionLimiter, loginLimiter } from "../security.js";
import { registrarAuditoria } from "../auditLog.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Política de senha do administrador — mais rígida que a do cliente de
 * propósito: essa é a conta que dá acesso aos dados de todos os clientes.
 */
const adminPasswordSchema = z
  .string()
  .min(12, "A senha deve ter pelo menos 12 caracteres.")
  .max(200, "Senha longa demais.")
  .regex(/[a-z]/, "A senha deve conter ao menos uma letra minúscula.")
  .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula.")
  .regex(/[0-9]/, "A senha deve conter ao menos um número.");

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual."),
  newPassword: adminPasswordSchema,
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });

  // Hash descartável quando o e-mail não existe: mantém o tempo de resposta
  // igual nos dois casos. Sem isso, a diferença de latência entrega quais
  // e-mails têm conta de administrador.
  const HASH_FICTICIO = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
  const valid = await bcrypt.compare(password, user?.passwordHash ?? HASH_FICTICIO);

  if (!user || !valid) {
    res.status(401).json({ error: "Credenciais inválidas." });
    return;
  }

  const token = signAdminToken({ sub: user.id, email: user.email, name: user.name });
  res.cookie(ADMIN_COOKIE_NAME, token, cookieOptions);
  await registrarAuditoria({
    adminId: user.id,
    adminEmail: user.email,
    action: "login",
    resource: "auth",
    ip: req.ip ?? "",
  });
  res.json({ name: user.name, email: user.email });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

authRouter.get("/me", requireAdmin, (req, res) => {
  res.json({ name: req.admin!.name, email: req.admin!.email });
});

/**
 * Troca de senha do administrador logado.
 *
 * Exige a senha atual (senão uma sessão sequestrada bastaria para tomar a
 * conta de vez) e, ao concluir, derruba TODAS as outras sessões abertas via
 * `sessionsValidFrom` — quem tiver um cookie roubado perde o acesso na hora.
 * A sessão de quem está trocando é reemitida para a pessoa não cair fora do
 * painel no meio da operação.
 */
authRouter.put("/password", requireAdmin, accountActionLimiter, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }

  const user = await prisma.adminUser.findUnique({ where: { id: req.admin!.sub } });
  if (!user) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  const atualConfere = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!atualConfere) {
    res.status(400).json({ error: "Senha atual incorreta." });
    return;
  }

  if (await bcrypt.compare(parsed.data.newPassword, user.passwordHash)) {
    res.status(400).json({ error: "A nova senha precisa ser diferente da atual." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const agora = new Date();
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash, sessionsValidFrom: agora },
  });

  // Reemite a sessão DEPOIS do corte, para esta aba continuar válida.
  const token = signAdminToken({ sub: user.id, email: user.email, name: user.name });
  res.cookie(ADMIN_COOKIE_NAME, token, cookieOptions);

  await registrarAuditoria({
    adminId: user.id,
    adminEmail: user.email,
    action: "alterar-senha",
    resource: "auth",
    detail: "senha alterada; demais sessões encerradas",
    ip: req.ip ?? "",
  });

  res.json({ ok: true });
});
