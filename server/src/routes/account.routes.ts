import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../db.js";
import {
  CUSTOMER_COOKIE_NAME,
  customerCookieOptions,
  generateResetToken,
  generateVerificationCode,
  hashSecret,
  signCustomerToken,
} from "../customerAuth.js";
import { requireCustomerAuth } from "../middleware/requireCustomer.js";
import { sendEmail } from "../email.js";
import { passwordResetEmail, verificationCodeEmail } from "../emailTemplates.js";

export const accountRouter = Router();

const CODE_TTL_MINUTES = 15;
const RESET_TTL_MINUTES = 60;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESENDS_PER_HOUR = 5;

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .regex(/[a-zA-Z]/, "A senha deve conter ao menos uma letra.")
  .regex(/[0-9]/, "A senha deve conter ao menos um número.");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});

function toPublicUser(customer: { id: string; name: string; email: string; emailVerified: boolean }) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    emailVerified: customer.emailVerified,
  };
}

function setCustomerSession(
  res: import("express").Response,
  customer: { id: string; name: string; email: string; emailVerified: boolean },
) {
  const token = signCustomerToken({
    sub: customer.id,
    name: customer.name,
    email: customer.email,
    emailVerified: customer.emailVerified,
  });
  res.cookie(CUSTOMER_COOKIE_NAME, token, customerCookieOptions);
}

class AccountError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Cria um novo código de verificação e envia por e-mail, respeitando limites de reenvio. */
async function issueVerificationCode(customerId: string, email: string, name: string) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const latest = await prisma.emailVerification.findFirst({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });

  if (latest) {
    const secondsSinceLast = (now.getTime() - latest.createdAt.getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      throw new AccountError(
        429,
        `Aguarde ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)} segundos para solicitar um novo código.`,
      );
    }
  }

  const resendsLastHour = await prisma.emailVerification.count({
    where: { customerId, createdAt: { gte: oneHourAgo } },
  });
  if (resendsLastHour >= MAX_RESENDS_PER_HOUR) {
    throw new AccountError(429, "Você atingiu o limite de tentativas. Aguarde alguns minutos.");
  }

  const code = generateVerificationCode();
  await prisma.emailVerification.create({
    data: {
      customerId,
      codeHash: hashSecret(code),
      expiresAt: new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000),
    },
  });

  try {
    const { subject, html } = verificationCodeEmail(code, CODE_TTL_MINUTES);
    await sendEmail({ to: email, subject, html });
  } catch (err) {
    console.error(`Falha ao enviar e-mail de verificação para ${email}:`, err);
    throw new AccountError(502, "Não foi possível enviar o código. Tente novamente.");
  }

  void name; // reservado para personalização futura do e-mail
}

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Aguarde alguns minutos." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

const accountActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Você atingiu o limite de tentativas. Aguarde alguns minutos." },
});

accountRouter.post("/register", registerLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    res.status(409).json({ error: "Este e-mail já está cadastrado." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Um cliente pode já existir como "convidado" de um pedido anterior sem
  // conta — nesse caso, transformamos o registro existente numa conta de
  // verdade (preservando o histórico de pedidos) em vez de bloquear.
  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data: { name, passwordHash, emailVerified: false },
      })
    : await prisma.customer.create({
        data: { name, email, passwordHash, emailVerified: false },
      });

  setCustomerSession(res, customer);

  try {
    await issueVerificationCode(customer.id, customer.email, customer.name);
  } catch (err) {
    if (err instanceof AccountError) {
      res.status(201).json({ user: toPublicUser(customer), warning: err.message });
      return;
    }
    throw err;
  }

  res.status(201).json({ user: toPublicUser(customer) });
});

accountRouter.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "E-mail ou senha incorretos." });
    return;
  }
  const { email, password } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer?.passwordHash) {
    res.status(401).json({ error: "E-mail ou senha incorretos." });
    return;
  }

  const valid = await bcrypt.compare(password, customer.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "E-mail ou senha incorretos." });
    return;
  }

  setCustomerSession(res, customer);
  res.json({ user: toPublicUser(customer) });
});

accountRouter.post("/logout", (_req, res) => {
  res.clearCookie(CUSTOMER_COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

accountRouter.get("/me", requireCustomerAuth, async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.customer!.sub } });
  if (!customer) {
    res.status(401).json({ error: "Sessão inválida." });
    return;
  }
  res.json({ user: toPublicUser(customer) });
});

accountRouter.post("/verify-email", accountActionLimiter, requireCustomerAuth, async (req, res) => {
  const schema = z.object({ code: z.string().trim().length(6, "Código inválido.") });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Este código de verificação está incorreto." });
    return;
  }

  const customer = await prisma.customer.findUnique({ where: { id: req.customer!.sub } });
  if (!customer) {
    res.status(401).json({ error: "Sessão inválida." });
    return;
  }
  if (customer.emailVerified) {
    res.json({ user: toPublicUser(customer) });
    return;
  }

  const pending = await prisma.emailVerification.findFirst({
    where: { customerId: customer.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!pending) {
    res.status(400).json({ error: "Não encontramos um código pendente. Solicite um novo." });
    return;
  }
  if (pending.expiresAt < new Date()) {
    res.status(400).json({ error: "Este código expirou." });
    return;
  }
  if (pending.attempts >= MAX_VERIFY_ATTEMPTS) {
    res.status(429).json({ error: "Você atingiu o limite de tentativas. Aguarde alguns minutos." });
    return;
  }

  if (hashSecret(parsed.data.code) !== pending.codeHash) {
    await prisma.emailVerification.update({
      where: { id: pending.id },
      data: { attempts: { increment: 1 } },
    });
    res.status(400).json({ error: "Este código de verificação está incorreto." });
    return;
  }

  const [, updated] = await prisma.$transaction([
    prisma.emailVerification.update({ where: { id: pending.id }, data: { usedAt: new Date() } }),
    prisma.customer.update({ where: { id: customer.id }, data: { emailVerified: true } }),
  ]);

  setCustomerSession(res, updated);
  res.json({ user: toPublicUser(updated) });
});

accountRouter.post("/resend-code", accountActionLimiter, requireCustomerAuth, async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.customer!.sub } });
  if (!customer) {
    res.status(401).json({ error: "Sessão inválida." });
    return;
  }
  if (customer.emailVerified) {
    res.status(400).json({ error: "Seu e-mail já foi verificado." });
    return;
  }

  try {
    await issueVerificationCode(customer.id, customer.email, customer.name);
  } catch (err) {
    if (err instanceof AccountError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }

  res.json({ ok: true });
});

accountRouter.post("/forgot-password", accountActionLimiter, async (req, res) => {
  const schema = z.object({ email: z.string().trim().toLowerCase().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Informe um e-mail válido." });
    return;
  }

  const customer = await prisma.customer.findUnique({ where: { email: parsed.data.email } });

  // Resposta sempre genérica — não revela se o e-mail existe ou tem senha.
  if (customer?.passwordHash) {
    const now = new Date();
    const recent = await prisma.passwordReset.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    });
    const onCooldown = recent && (now.getTime() - recent.createdAt.getTime()) / 1000 < RESEND_COOLDOWN_SECONDS;

    if (!onCooldown) {
      const token = generateResetToken();
      await prisma.passwordReset.create({
        data: {
          customerId: customer.id,
          tokenHash: hashSecret(token),
          expiresAt: new Date(now.getTime() + RESET_TTL_MINUTES * 60 * 1000),
        },
      });

      const origin = `${req.protocol}://${req.get("host")}`;
      const link = `${origin}/redefinir-senha?token=${token}`;
      try {
        const { subject, html } = passwordResetEmail(link, RESET_TTL_MINUTES);
        await sendEmail({ to: customer.email, subject, html });
      } catch (err) {
        console.error(`Falha ao enviar e-mail de redefinição de senha para ${customer.email}:`, err);
      }
    }
  }

  res.json({ ok: true });
});

accountRouter.post("/reset-password", accountActionLimiter, async (req, res) => {
  const schema = z.object({ token: z.string().min(1), password: passwordSchema });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }

  const reset = await prisma.passwordReset.findUnique({
    where: { tokenHash: hashSecret(parsed.data.token) },
  });
  if (!reset) {
    res.status(400).json({ error: "Este link de redefinição é inválido." });
    return;
  }
  if (reset.usedAt) {
    res.status(400).json({ error: "Este link já foi utilizado." });
    return;
  }
  if (reset.expiresAt < new Date()) {
    res.status(400).json({ error: "Este link expirou." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.customer.update({ where: { id: reset.customerId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);

  res.json({ ok: true });
});

accountRouter.put("/password", accountActionLimiter, requireCustomerAuth, async (req, res) => {
  const schema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }

  const customer = await prisma.customer.findUnique({ where: { id: req.customer!.sub } });
  if (!customer?.passwordHash) {
    res.status(401).json({ error: "Sessão inválida." });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, customer.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Senha atual incorreta." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.customer.update({ where: { id: customer.id }, data: { passwordHash } });
  res.json({ ok: true });
});

accountRouter.get("/orders", requireCustomerAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { customerId: req.customer!.sub },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ items: orders });
});
