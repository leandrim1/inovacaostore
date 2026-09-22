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
  /** Só dígitos (ex.: "34996576357"); string vazia quando nunca foi informado. */
  phone: string;
  emailVerified: boolean;
  /** ISO — vira o "Cliente desde" da área do cliente. */
  createdAt: string;
}

/** Campos que o próprio cliente pode editar — o e-mail é a identidade da conta e fica fora. */
export interface ProfileInput {
  name?: string;
  phone?: string;
}

type AuthResult = { ok: true } | { ok: false; error: string };
/**
 * `emailNotSent`: a conta foi criada, mas o código de verificação não saiu.
 * O servidor responde 201 mesmo assim (a conta existe), e sem este sinal a
 * tela seguinte afirmava "enviamos um código" para quem não recebeu nada.
 */
type AuthUserResult = { ok: true; user: User; emailNotSent?: boolean } | { ok: false; error: string };

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
  updateProfile: (data: ProfileInput) => Promise<AuthUserResult>;
  deleteAccount: (password: string) => Promise<AuthResult>;
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
        const { user: created, warning } = await api.post<{ user: User; warning?: string }>(
          "/api/account/register",
          { name, email, password },
        );
        setUser(created);
        return { ok: true, user: created, emailNotSent: Boolean(warning) };
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

  const updateProfile = useCallback(async (data: ProfileInput): Promise<AuthUserResult> => {
    try {
      const { user: updated } = await api.patch<{ user: User }>("/api/account/me", data);
      setUser(updated);
      return { ok: true, user: updated };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Não foi possível salvar seus dados.") };
    }
  }, []);

  /**
   * Exclusão da conta. O servidor anonimiza o cadastro e encerra a sessão;
   * aqui só limpamos o usuário em memória para a interface acompanhar.
   */
  const deleteAccount = useCallback(async (password: string): Promise<AuthResult> => {
    try {
      await api.delete("/api/account/me", { password });
      setUser(null);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorMessage(err, "Não foi possível excluir sua conta.") };
    }
  }, []);

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
    updateProfile,
    deleteAccount,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
