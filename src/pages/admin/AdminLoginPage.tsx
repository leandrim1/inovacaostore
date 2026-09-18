import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../../components/ui/Logo";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { useAdminAuth } from "../../context/AdminAuthContext";

const ADMIN_INPUT_CLASS = "admin-input px-4 py-2";

export default function AdminLoginPage() {
  const { admin, isLoading, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && admin) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? "/admin";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Não foi possível entrar.");
      return;
    }
    navigate("/admin", { replace: true });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-cream px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo />
          <span className="font-display text-sm tracking-widest text-neutral-400">PAINEL ADMINISTRATIVO</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={ADMIN_INPUT_CLASS}
          />
          <PasswordInput
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={ADMIN_INPUT_CLASS}
          />
          {error && <p className="alert-error">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full disabled:opacity-60">
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
