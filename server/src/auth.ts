import { signToken, verifyToken } from "./tokens.js";

export const ADMIN_COOKIE_NAME = "admin_session";

export interface AdminTokenPayload {
  sub: string;
  email: string;
  name: string;
}

export const signAdminToken = (payload: AdminTokenPayload) => signToken("admin", payload, "7d");

export const verifyAdminToken = (token: string) => verifyToken<AdminTokenPayload>("admin", token);

export const cookieOptions = {
  httpOnly: true,
  // `strict` no admin: o painel nunca é aberto a partir de outro site, então
  // não há fluxo legítimo que precise do cookie numa navegação cross-site.
  // É uma camada a mais contra CSRF, além do checkForgedOrigin.
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};
