import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../../components/ui/Logo";
import { useAdminAuth } from "../../context/AdminAuthContext";

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
            className="rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full disabled:opacity-60">
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
