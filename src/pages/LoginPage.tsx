import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Seo } from "../components/seo/Seo";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (!result.user.emailVerified) {
      navigate(`/verificar-email?redirect=${encodeURIComponent(redirect)}`, { replace: true });
      return;
    }
    navigate(redirect, { replace: true });
  }

  return (
    <>
      <Seo title="Entrar" description="Entre na sua conta da Inovação Store." />
      <div className="container-page flex min-h-[70vh] items-center justify-center py-14">
        <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5">
          <h1 className="section-title mb-1 text-2xl">Entrar</h1>
          <p className="mb-6 text-sm text-neutral-500">
            Acesse sua conta para acompanhar seus pedidos.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
            />
            <Link to="/esqueci-senha" className="-mt-1 text-right text-xs text-neutral-500 hover:text-brand-ink">
              Esqueci minha senha
            </Link>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 w-full disabled:opacity-60">
              {isSubmitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <Link
            to={`/cadastro?redirect=${encodeURIComponent(redirect)}`}
            className="mt-4 block text-center text-sm text-neutral-500 hover:text-brand-ink"
          >
            Não tem conta? Cadastre-se
          </Link>
        </div>
      </div>
    </>
  );
}
