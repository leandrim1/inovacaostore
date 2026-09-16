import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido. Configure a variável de ambiente antes de iniciar o servidor.");
}

export const ADMIN_COOKIE_NAME = "admin_session";

export interface AdminTokenPayload {
  sub: string;
  email: string;
  name: string;
}

export const signAdminToken = (payload: AdminTokenPayload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

export const verifyAdminToken = (token: string): AdminTokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
};

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};
