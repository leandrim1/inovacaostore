import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Valores lidos com `trim()`: colar no painel da Vercel costuma trazer um
 * espaço ou uma quebra de linha no fim, e "smtp.gmail.com\n" é um host que
 * não existe — o envio falha com um erro que não aponta para o motivo real.
 */
function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

const SMTP_HOST = env("SMTP_HOST") || "smtp.gmail.com";
const SMTP_PORT = Number(env("SMTP_PORT")) || 465;
const SMTP_USER = env("SMTP_USER");
const SMTP_FROM_NAME = env("SMTP_FROM_NAME") || "Inovação Store";

/**
 * O Google mostra a senha de app em quatro blocos ("abcd efgh ijkl mnop").
 * Colada assim, com os espaços, o login é recusado. Uma senha de app do
 * Gmail nunca tem espaço de verdade, então tirar é seguro — só para o Gmail:
 * em outro provedor, um espaço pode fazer parte da senha.
 */
const SMTP_PASSWORD = (() => {
  const raw = env("SMTP_PASSWORD");
  if (!raw) return undefined;
  return /gmail\.com$/i.test(SMTP_HOST) ? raw.replace(/\s+/g, "") : raw;
})();

/**
 * Tempo máximo de cada etapa da conversa com o servidor de e-mail.
 *
 * O padrão do nodemailer espera até 2 minutos para conectar, e a função na
 * Vercel morre em 30s (vercel.json). Com o padrão, um SMTP travado derrubava
 * a requisição inteira com um 504 genérico, sem nenhum registro do motivo.
 * Com 10s o erro volta a tempo de ser classificado e mostrado.
 */
const TIMEOUT_MS = 10_000;

export type EmailFailureReason =
  | "nao_configurado"
  | "autenticacao"
  | "conexao"
  | "tempo_esgotado"
  | "destinatario"
  | "desconhecido";

/** Falha de envio já classificada. Nunca carrega a senha. */
export class EmailError extends Error {
  reason: EmailFailureReason;
  /** Código/resposta do servidor SMTP, para o diagnóstico do painel. */
  detail: string;
  constructor(reason: EmailFailureReason, detail: string) {
    super(`Falha no envio de e-mail (${reason}): ${detail}`);
    this.reason = reason;
    this.detail = detail;
  }
}

interface SmtpLikeError {
  code?: string;
  responseCode?: number;
  response?: string;
  command?: string;
  message?: string;
}

/**
 * Traduz o erro do nodemailer num motivo que o lojista consegue resolver.
 * O texto da resposta do servidor entra (truncado) porque é ele que diz, por
 * exemplo, "Application-specific password required" — e não contém segredo.
 */
export function classifyEmailError(err: unknown): EmailError {
  if (err instanceof EmailError) return err;
  const e = (err ?? {}) as SmtpLikeError;
  const code = e.code ?? "";
  const detail = [code, e.responseCode, e.response ?? e.message]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 240);

  if (code === "EAUTH" || e.responseCode === 535 || e.responseCode === 534) {
    return new EmailError("autenticacao", detail);
  }
  if (code === "ETIMEDOUT" || /timeout/i.test(e.message ?? "")) {
    return new EmailError("tempo_esgotado", detail);
  }
  if (["ECONNECTION", "ECONNREFUSED", "ENOTFOUND", "EDNS", "ESOCKET", "ETLS", "ECONNRESET"].includes(code)) {
    return new EmailError("conexao", detail);
  }
  if (code === "EENVELOPE" || (e.responseCode && e.responseCode >= 550 && e.responseCode < 560)) {
    return new EmailError("destinatario", detail);
  }
  return new EmailError("desconhecido", detail || "erro sem código");
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    throw new EmailError(
      "nao_configurado",
      `${!SMTP_USER ? "SMTP_USER" : ""}${!SMTP_USER && !SMTP_PASSWORD ? " e " : ""}${!SMTP_PASSWORD ? "SMTP_PASSWORD" : ""} ausente(s)`,
    );
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });
  }
  return transporter;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/** Envia um e-mail. Qualquer falha sobe como `EmailError` já classificado. */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    throw classifyEmailError(err);
  }
}

/** "leandro@gmail.com" → "le•••••@gmail.com": o bastante para reconhecer a conta. */
function maskEmail(value: string) {
  const [local, domain] = value.split("@");
  if (!domain) return "•••";
  return `${local.slice(0, 2)}${"•".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

/**
 * Resumo da configuração para o painel. Mostra host, porta e a conta
 * mascarada — é o que permite ao lojista ver, sem abrir a Vercel, que a
 * produção está apontando para o lugar errado. A senha nunca sai daqui:
 * nem ela, nem o tamanho dela.
 */
export function describeEmailConfig() {
  return {
    configured: Boolean(SMTP_USER && SMTP_PASSWORD),
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER ? maskEmail(SMTP_USER) : null,
    hasPassword: Boolean(SMTP_PASSWORD),
    fromName: SMTP_FROM_NAME,
  };
}
