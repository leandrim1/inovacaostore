import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface Customer {
  name: string;
  email: string;
}

interface StoredUser extends Customer {
  password: string;
}

const USERS_KEY = "inovacaostore.users.v1";
const SESSION_KEY = "inovacaostore.session.v1";

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignora se localStorage não estiver disponível
  }
}

function readSession(): Customer | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Customer) : null;
  } catch {
    return null;
  }
}

function writeSession(customer: Customer | null) {
  try {
    if (customer) localStorage.setItem(SESSION_KEY, JSON.stringify(customer));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignora se localStorage não estiver disponível
  }
}

interface AuthContextValue {
  customer: Customer | null;
  isAccountOpen: boolean;
  openAccount: () => void;
  closeAccount: () => void;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (
    name: string,
    email: string,
    password: string,
  ) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(() => readSession());
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const login = useCallback((email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      return { ok: false, error: "Informe e-mail e senha." };
    }
    const users = readUsers();
    const user = users.find((u) => u.email.toLowerCase() === normalized);
    if (!user) {
      return { ok: false, error: "Não encontramos uma conta com esse e-mail." };
    }
    if (user.password !== password) {
      return { ok: false, error: "Senha incorreta." };
    }
    const session = { name: user.name, email: user.email };
    setCustomer(session);
    writeSession(session);
    setIsAccountOpen(false);
    return { ok: true };
  }, []);

  const register = useCallback(
    (name: string, email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      if (!name.trim() || !normalized || password.length < 4) {
        return {
          ok: false,
          error: "Preencha nome, e-mail e uma senha com ao menos 4 caracteres.",
        };
      }
      const users = readUsers();
      if (users.some((u) => u.email.toLowerCase() === normalized)) {
        return { ok: false, error: "Já existe uma conta com esse e-mail." };
      }
      const newUser: StoredUser = { name: name.trim(), email: normalized, password };
      writeUsers([...users, newUser]);
      const session = { name: newUser.name, email: newUser.email };
      setCustomer(session);
      writeSession(session);
      setIsAccountOpen(false);
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(() => {
    setCustomer(null);
    writeSession(null);
  }, []);

  const value: AuthContextValue = {
    customer,
    isAccountOpen,
    openAccount: () => setIsAccountOpen(true),
    closeAccount: () => setIsAccountOpen(false),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
