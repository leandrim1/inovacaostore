import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";

export interface AdminUser {
  name: string;
  email: string;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<AdminUser>("/api/admin/auth/me")
      .then(setAdmin)
      .catch(() => setAdmin(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const user = await api.post<AdminUser>("/api/admin/auth/login", { email, password });
      setAdmin(user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Não foi possível entrar." };
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/admin/auth/logout").catch(() => {});
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth deve ser usado dentro de AdminAuthProvider");
  return ctx;
}
