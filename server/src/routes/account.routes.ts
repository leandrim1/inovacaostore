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
import { classifyEmailError, sendEmail } from "../email.js";
import { accountEmailLimiter, loginLimiter as ipAndAccountLoginLimiter, publicBaseUrl } from "../security.js";
import { passwordResetEmail, verificationCodeEmail } from "../emailTemplates.js";
import { customerAddressesRouter } from "./addresses.routes.js";

export const accountRouter = Router();

// Montado aqui, e não em app.ts, para deixar óbvio que o caderninho de
// endereços vive dentro da conta do cliente logado.
accountRouter.use("/addresses", customerAddressesRouter);

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

/**
 * Recorte do cadastro que pode sair do servidor. É uma lista explícita, não
 * um `...customer`: assim um campo novo no schema (hash de senha, token,
 * `sessionsValidFrom`) nunca vaza para o cliente por esquecimento.
 */
function toPublicUser(customer: {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  createdAt: Date;
}) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    emailVerified: customer.emailVerified,
    createdAt: customer.createdAt,
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
  const registro = await prisma.emailVerification.create({
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
    // Desfaz o registro do código: um código que não saiu não pode contar
    // para o intervalo de reenvio. Sem isto, o cliente clicava em "Reenviar"
    // e ouvia "aguarde 60 segundos" por um e-mail que nunca foi enviado.
    await prisma.emailVerification.delete({ where: { id: registro.id } }).catch(() => undefined);
    const falha = classifyEmailError(err);
    // O motivo classificado vai para o log da Vercel; o cliente recebe uma
    // mensagem genérica — "senha SMTP recusada" não é assunto dele.
    console.error(`[email] código de verificação não enviado (${falha.reason}): ${falha.detail}`);
    throw new AccountError(502, "Não foi possível enviar o código agora. Tente reenviar em instantes.");
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

const accountActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Você atingiu o limite de tentativas. Aguarde alguns minutos." },
});

accountRouter.post("/register", registerLimiter, accountEmailLimiter, async (req, res) => {
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

accountRouter.post("/login", ipAndAccountLoginLimiter, async (req, res) => {
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
  res.clearCookie(CUSTOMER_COOKIE_NAME, { ...customerCookieOptions, maxAge: undefined });
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

/**
 * Edição dos próprios dados ("Editar dados" da área do cliente).
 *
 * Só nome e telefone: o e-mail é a identidade da conta e trocá-lo exigiria
 * reverificação (e abriria caminho para tomar a conta de outra pessoa
 * passando o e-mail dela). A identidade vem da sessão, nunca do corpo — o
 * cliente não escolhe qual cadastro está editando.
 */
accountRouter.patch("/me", accountActionLimiter, requireCustomerAuth, async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2, "Informe seu nome completo.").max(80).optional(),
    // Só dígitos: guardar "(34) 99657-6357" e "34996576357" como coisas
    // diferentes atrapalharia na hora de achar o cliente pelo telefone.
    phone: z
      .string()
      .trim()
      .max(20)
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v === "" || (v.length >= 10 && v.length <= 13), "Telefone inválido.")
      .optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }

  const { name, phone } = parsed.data;
  if (name === undefined && phone === undefined) {
    res.status(400).json({ error: "Nada para atualizar." });
    return;
  }

  const customer = await prisma.customer.update({
    where: { id: req.customer!.sub },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
    },
  });

  res.json({ user: toPublicUser(customer) });
});

/**
 * Exclusão da conta pelo próprio cliente (LGPD).
 *
 * ANONIMIZA em vez de apagar a linha. Apagar levaria junto os pedidos — e
 * com eles o faturamento, o lucro e o fechamento do mês que o lojista
 * precisa. O que é dado pessoal sai; o que é registro contábil fica.
 *
 * Sai de vez:
 *  - nome, e-mail e telefone do cadastro (e-mail vira um endereço num TLD
 *    reservado, que nunca pode existir de verdade);
 *  - endereços salvos, códigos de verificação e tokens de redefinição;
 *  - depoimentos enviados por esta conta — são as palavras da pessoa
 *    assinadas com o nome dela; "anonimizar" deixaria o texto no ar, que é
 *    o oposto do que ela pediu;
 *  - rua, número, complemento, bairro e CEP dos pedidos.
 *
 * Fica:
 *  - o pedido inteiro no que importa para a contabilidade (itens, valores,
 *    custos, status, data e forma de pagamento);
 *  - cidade e UF do pedido, porque o relatório de vendas por região é
 *    construído em cima deles e sozinhos não identificam ninguém.
 *
 * Pede a senha de novo: uma sessão roubada não pode apagar a conta da
 * vítima só por estar aberta.
 */
accountRouter.delete("/me", accountActionLimiter, requireCustomerAuth, async (req, res) => {
  const schema = z.object({ password: z.string().min(1, "Informe sua senha para confirmar.") });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }

  const customerId = req.customer!.sub;
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer?.passwordHash) {
    res.status(401).json({ error: "Sessão inválida." });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, customer.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Senha incorreta." });
    return;
  }

  const agora = new Date();
  await prisma.$transaction([
    prisma.customerAddress.deleteMany({ where: { customerId } }),
    prisma.emailVerification.deleteMany({ where: { customerId } }),
    prisma.passwordReset.deleteMany({ where: { customerId } }),
    prisma.testimonial.deleteMany({ where: { customerId } }),
    prisma.order.updateMany({
      where: { customerId },
      // Cidade e UF continuam: são o eixo do relatório por região e não
      // apontam para uma pessoa. Rua e CEP apontam, então saem.
      data: { street: "—", number: "—", complement: "", neighborhood: "—", cep: "" },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: {
        name: "Cliente removido",
        // TLD reservado pela IANA: nunca vai existir, então não há risco de
        // um dia este endereço cair na caixa de outra pessoa.
        email: `removido-${customerId}@conta-excluida.invalid`,
        phone: "",
        // Sem senha não há login; `sessionsValidFrom` derruba na hora
        // qualquer sessão aberta em outro aparelho.
        passwordHash: null,
        emailVerified: false,
        sessionsValidFrom: agora,
        anonymizedAt: agora,
      },
    }),
  ]);

  res.clearCookie(CUSTOMER_COOKIE_NAME, { ...customerCookieOptions, maxAge: undefined });
  res.json({ ok: true });
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

accountRouter.post("/forgot-password", accountEmailLimiter, accountActionLimiter, async (req, res) => {
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
      const registro = await prisma.passwordReset.create({
        data: {
          customerId: customer.id,
          tokenHash: hashSecret(token),
          expiresAt: new Date(now.getTime() + RESET_TTL_MINUTES * 60 * 1000),
        },
      });

      // Base vinda da configuração do servidor, NUNCA do header Host da
      // requisição: senão um atacante pede a redefinição da conta da vítima
      // com `Host: site-dele.com` e o e-mail da vítima chega com um link
      // legítimo, token válido, apontando para o site do atacante.
      const link = `${publicBaseUrl()}/redefinir-senha?token=${token}`;
      try {
        const { subject, html } = passwordResetEmail(link, RESET_TTL_MINUTES);
        await sendEmail({ to: customer.email, subject, html });
      } catch (err) {
        // Mesmo motivo do código de verificação: um link que não saiu não
        // pode travar o próximo pedido no intervalo de 60 segundos. A
        // resposta ao cliente continua genérica (não revela se a conta existe).
        await prisma.passwordReset.delete({ where: { id: registro.id } }).catch(() => undefined);
        const falha = classifyEmailError(err);
        console.error(`[email] link de redefinição não enviado (${falha.reason}): ${falha.detail}`);
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
    // `sessionsValidFrom` derruba TODAS as sessões abertas da conta. Numa
    // redefinição de senha isso é o ponto principal: quem invadiu a conta
    // perde o acesso na hora, em vez de continuar logado por 30 dias.
    prisma.customer.update({
      where: { id: reset.customerId },
      data: { passwordHash, sessionsValidFrom: new Date() },
    }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    // Qualquer outro link de redefinição pendente também deixa de valer.
    prisma.passwordReset.updateMany({
      where: { customerId: reset.customerId, usedAt: null },
      data: { usedAt: new Date() },
    }),
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
  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordHash, sessionsValidFrom: new Date() },
  });
  // Derruba as outras sessões e reemite a desta aba, para quem trocou a senha
  // não ser deslogado pelo próprio corte.
  setCustomerSession(res, updated);
  res.json({ ok: true });
});

accountRouter.get("/orders", requireCustomerAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    // O filtro por cliente vem da sessão. Não existe parâmetro de cliente
    // nesta rota de propósito: se existisse, seria só trocar o id na URL
    // para ler o histórico de compras de outra pessoa.
    where: { customerId: req.customer!.sub },
    include: {
      items: {
        include: {
          variant: {
            select: {
              product: {
                select: {
                  slug: true,
                  // Só a capa: puxar a galeria inteira de cada item para
                  // mostrar uma miniatura seria desperdício de banco.
                  images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // `variant` sai da resposta: ele só entrou na consulta para trazer a capa
  // e o slug, e devolvê-lo inteiro exporia estoque e SKU sem necessidade.
  const items = orders.map((order) => ({
    ...order,
    items: order.items.map(({ variant, ...item }) => ({
      ...item,
      imageUrl: variant?.product?.images[0]?.url ?? null,
      productSlug: variant?.product?.slug ?? null,
    })),
  }));

  res.json({ items });
});
