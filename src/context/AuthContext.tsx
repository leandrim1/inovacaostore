import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}

type AuthResult = { ok: true } | { ok: false; error: string };
type AuthUserResult = { ok: true; user: User } | { ok: false; error: string };

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUserResult>;
  register: (name: string, email: string, password: string) => Promise<AuthUserResult>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<AuthUserResult>;
  resendCode: () => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (token: string, password: string) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await api.get<{ user: User }>("/api/account/me");
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUserResult> => {
    try {
      const { user: logged } = await api.post<{ user: User }>("/api/account/login", { email, password });
      setUser(logged);
      return { ok: true, user: logged };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Não foi possível entrar.") };
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthUserResult> => {
      try {
        const { user: created } = await api.post<{ user: User }>("/api/account/register", {
          name,
          email,
          password,
        });
        setUser(created);
        return { ok: true, user: created };
      } catch (err) {
        return { ok: false, error: errorMessage(err, "Não foi possível criar sua conta.") };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.post("/api/account/logout").catch(() => {});
    setUser(null);
  }, []);

  const verifyEmail = useCallback(async (code: string): Promise<AuthUserResult> => {
    try {
      const { user: verified } = await api.post<{ user: User }>("/api/account/verify-email", { code });
      setUser(verified);
      return { ok: true, user: verified };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Não foi possível confirmar o código.") };
    }
  }, []);

  const resendCode = useCallback(async (): Promise<AuthResult> => {
    try {
      await api.post("/api/account/resend-code");
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Não foi possível reenviar o código.") };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      await api.post("/api/account/forgot-password", { email });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Não foi possível enviar o e-mail.") };
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string): Promise<AuthResult> => {
    try {
      await api.post("/api/account/reset-password", { token, password });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Não foi possível redefinir sua senha.") };
    }
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
      try {
        await api.put("/api/account/password", { currentPassword, newPassword });
        return { ok: true };
      } catch (err) {
        return { ok: false, error: errorMessage(err, "Não foi possível alterar sua senha.") };
      }
    },
    [],
  );

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    verifyEmail,
    resendCode,
    forgotPassword,
    resetPassword,
    changePassword,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
