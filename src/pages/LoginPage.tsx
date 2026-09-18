import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Seo } from "../components/seo/Seo";
import { AuthLayout } from "../components/layout/AuthLayout";
import { PasswordInput } from "../components/ui/PasswordInput";
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
      <AuthLayout eyebrow="Bem-vindo de volta" title="Entrar" subtitle="Acesse sua conta para acompanhar seus pedidos.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="input-field"
          />
          <PasswordInput
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Link to="/esqueci-senha" className="-mt-1 text-right text-xs text-neutral-500 hover:text-brand-ink">
            Esqueci minha senha
          </Link>

          {error && <p className="alert-error">{error}</p>}

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
      </AuthLayout>
    </>
  );
}
