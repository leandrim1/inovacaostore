import crypto from "node:crypto";
import { signToken, verifyToken } from "./tokens.js";

export const CUSTOMER_COOKIE_NAME = "customer_session";

export interface CustomerTokenPayload {
  sub: string;
  name: string;
  email: string;
  emailVerified: boolean;
}

export const signCustomerToken = (payload: CustomerTokenPayload) =>
  signToken("customer", payload, "30d");

export const verifyCustomerToken = (token: string) => verifyToken<CustomerTokenPayload>("customer", token);

export const customerCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
};

/** Código numérico de 6 dígitos para verificação de e-mail. */
export function generateVerificationCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Token opaco e longo para o link de redefinição de senha. */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash de código/token antes de gravar no banco — mesmo se o banco vazar,
 * ninguém consegue reconstruir o valor original para usá-lo.
 */
export function hashSecret(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
