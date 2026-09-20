import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Domínios que podem enviar requisições autenticadas. Em produção vem de
 * PUBLIC_URL/ALLOWED_ORIGINS; em desenvolvimento, o Vite local.
 */
export function allowedOrigins(): string[] {
  const list = [
    process.env.PUBLIC_URL,
    ...(process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter((o): o is string => Boolean(o));

  if (process.env.NODE_ENV !== "production") {
    list.push("http://localhost:5173", "http://localhost:4000", "http://127.0.0.1:5173");
  }
  return [...new Set(list.map((o) => o.replace(/\/$/, "")))];
}

/**
 * Base pública do site, usada para montar links enviados por e-mail.
 *
 * NUNCA derivar do header `Host` da requisição: ele é controlado por quem
 * chama. Um atacante pediria "esqueci minha senha" da conta da vítima com
 * `Host: site-do-atacante.com` e o link de redefinição chegaria no e-mail da
 * vítima apontando para o site dele — com um token válido.
 */
export function publicBaseUrl(): string {
  const configured = process.env.PUBLIC_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("PUBLIC_URL não definido. É obrigatório em produção para gerar links de e-mail seguros.");
  }
  return "http://localhost:5173";
}

/**
 * Cabeçalhos de segurança.
 *
 * A CSP precisa liberar o Google Fonts (CSS + arquivos), imagens vindas do
 * Vercel Blob e estilos inline (o framer-motion anima via atributo `style`).
 * `frame-ancestors 'none'` é a proteção contra clickjacking; `object-src
 * 'none'` corta plugins legados.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      formAction: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://viacep.com.br", "https://nominatim.openstreetmap.org"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "same-site" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  frameguard: { action: "deny" },
  noSniff: true,
  xPoweredBy: false,
});

/** Desliga tudo que um arquivo enviado por terceiros poderia tentar executar. */
export function uploadHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
}

/**
 * Defesa em profundidade contra CSRF, além do SameSite dos cookies.
 *
 * Toda requisição que muda estado precisa vir de uma origem conhecida.
 * Requisições sem Origin/Referer (curl, apps nativos) passam, porque
 * navegadores SEMPRE enviam Origin em POST/PUT/PATCH/DELETE cross-site — é
 * justamente o caso que queremos barrar.
 */
export function blockForgedOrigin(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  let origin: string | null = req.get("origin") ?? null;
  if (!origin) {
    const referer = req.get("referer");
    try {
      origin = referer ? new URL(referer).origin : null;
    } catch {
      origin = null;
    }
  }
  if (!origin) {
    next();
    return;
  }

  const normalizada = origin.replace(/\/$/, "");

  // Mesma origem da própria requisição também vale. Isso faz a proteção
  // funcionar em qualquer domínio sem configuração — importante porque a
  // Vercel gera uma URL diferente a cada deploy, e exigir PUBLIC_URL aqui
  // derrubaria toda escrita legítima num deploy recém-publicado.
  //
  // Comparar Origin com o Host é seguro para CSRF (ao contrário de usar o
  // Host para montar links de e-mail): num ataque real quem define o Origin é
  // o navegador da vítima, apontando para o site do atacante, e o navegador
  // não deixa uma página forjar o Host/X-Forwarded-Host da requisição.
  const mesmaOrigem = `${req.protocol}://${req.get("host")}`;

  if (normalizada !== mesmaOrigem && !allowedOrigins().includes(normalizada)) {
    res.status(403).json({ error: "Origem não autorizada." });
    return;
  }
  next();
}

/** Conta tentativas por IP + alvo, para um atacante não diluir o limite trocando de conta. */
function keyByIpAndBody(field: string) {
  return (req: Request) => {
    const ip = ipKeyGenerator(req.ip ?? "");
    const target = typeof req.body?.[field] === "string" ? String(req.body[field]).toLowerCase().slice(0, 120) : "";
    return `${ip}:${target}`;
  };
}

const baseLimiter = { standardHeaders: true as const, legacyHeaders: false as const };

/** Limite amplo em toda a API: trava varredura automatizada sem atrapalhar uso normal. */
export const globalApiLimiter = rateLimit({
  ...baseLimiter,
  windowMs: 5 * 60 * 1000,
  limit: 600,
  message: { error: "Muitas requisições. Aguarde alguns instantes." },
});

/** Endpoints de escrita pública (pedido, depoimento, cupom, frete). */
export const publicWriteLimiter = rateLimit({
  ...baseLimiter,
  windowMs: 10 * 60 * 1000,
  limit: 40,
  message: { error: "Muitas requisições. Aguarde alguns instantes." },
});

/** Painel administrativo: um admin legítimo nunca chega perto desse volume. */
export const adminApiLimiter = rateLimit({
  ...baseLimiter,
  windowMs: 5 * 60 * 1000,
  limit: 300,
  message: { error: "Muitas requisições. Aguarde alguns instantes." },
});

/**
 * Login: limite por IP **e por conta alvo**. Só por IP, um ataque distribuído
 * passa; só por conta, um credential stuffing contra milhares de contas passa.
 */
export const loginLimiter = rateLimit({
  ...baseLimiter,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: keyByIpAndBody("email"),
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

/** Ações sensíveis de conta já autenticada (troca de senha, etc.). */
export const accountActionLimiter = rateLimit({
  ...baseLimiter,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: "Muitas tentativas. Aguarde alguns minutos." },
});

export const accountEmailLimiter = rateLimit({
  ...baseLimiter,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: keyByIpAndBody("email"),
  message: { error: "Muitas tentativas. Aguarde alguns minutos." },
});
