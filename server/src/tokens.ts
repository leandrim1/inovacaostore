import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido. Configure a variável de ambiente antes de iniciar o servidor.");
}
if (JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET muito curto. Use pelo menos 32 caracteres aleatórios.");
}

/**
 * Chaves SEPARADAS para admin e cliente, derivadas do mesmo JWT_SECRET.
 *
 * Antes os dois tipos de sessão eram assinados com a mesma chave e o
 * middleware de admin confiava no payload sem consultar o banco: bastava
 * copiar o cookie `customer_session` para `admin_session` e qualquer cliente
 * cadastrado virava administrador. Com chaves distintas, um token de cliente
 * nem sequer passa na verificação de assinatura do lado admin.
 *
 * A derivação evita exigir uma variável de ambiente nova no deploy — mas as
 * duas chaves são criptograficamente independentes entre si.
 */
function deriveKey(purpose: string): string {
  return crypto.createHmac("sha256", JWT_SECRET as string).update(purpose).digest("hex");
}

const KEYS = {
  admin: deriveKey("inovacaostore/admin-session/v1"),
  customer: deriveKey("inovacaostore/customer-session/v1"),
} as const;

export type TokenAudience = keyof typeof KEYS;

const ISSUER = "inovacaostore";

export interface BaseClaims {
  sub: string;
  /** Instante em que a sessão foi emitida, em ms. Usado para revogação. */
  iat?: number;
}

/**
 * Assina sempre com HS256 e grava issuer/audience explícitos. A audience é o
 * que impede um token de um contexto ser aceito em outro.
 */
export function signToken<T extends object>(audience: TokenAudience, payload: T, expiresIn: string): string {
  return jwt.sign(payload, KEYS[audience], {
    algorithm: "HS256",
    issuer: ISSUER,
    audience,
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Verifica assinatura, algoritmo, issuer, audience e expiração. O
 * `algorithms: ["HS256"]` é o que bloqueia o ataque clássico de trocar o
 * header para `alg: none` ou para um algoritmo assimétrico.
 */
export function verifyToken<T>(audience: TokenAudience, token: string): (T & { iat: number }) | null {
  try {
    return jwt.verify(token, KEYS[audience], {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience,
    }) as unknown as T & { iat: number };
  } catch {
    return null;
  }
}

/**
 * Uma sessão é inválida se foi emitida antes do último "corte" da conta
 * (troca de senha, redefinição, logout de todos os dispositivos). É o que dá
 * poder de revogação a um JWT, que por natureza é stateless.
 *
 * O `iat` do JWT tem precisão de segundos, então descontamos 1s para não
 * invalidar por engano a sessão emitida no mesmo segundo do corte.
 */
export function isSessionRevoked(issuedAtSeconds: number, sessionsValidFrom: Date | null): boolean {
  if (!sessionsValidFrom) return false;
  return issuedAtSeconds * 1000 < sessionsValidFrom.getTime() - 1000;
}
