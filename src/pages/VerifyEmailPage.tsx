import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Seo } from "../components/seo/Seo";
import { AuthLayout } from "../components/layout/AuthLayout";
import { useAuth } from "../context/AuthContext";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const { user, isAuthenticated, isLoading, verifyEmail, resendCode, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
      return;
    }
    if (user?.emailVerified) {
      navigate(redirect, { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate, redirect]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);
    const result = await verifyEmail(code.trim());
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(redirect, { replace: true });
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setIsResending(true);
    const result = await resendCode();
    setIsResending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInfo("Enviamos um novo código para o seu e-mail.");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  if (isLoading || !isAuthenticated || user?.emailVerified) {
    return <div className="flex min-h-[50vh] items-center justify-center text-neutral-400">Carregando…</div>;
  }

  return (
    <>
      <Seo title="Confirme seu e-mail" description="Confirme seu e-mail para continuar." />
      <AuthLayout
        eyebrow="Última etapa"
        title="Confirme seu e-mail"
        subtitle={
          <>Enviamos um código de verificação para <strong className="text-brand-ink">{user?.email}</strong>.</>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Código de 6 dígitos"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            autoFocus
            className="input-field text-center text-lg tracking-[0.3em]"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-700">{info}</p>}

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="btn-primary mt-2 w-full disabled:opacity-60"
          >
            {isSubmitting ? "Confirmando…" : "Confirmar código"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || cooldown > 0}
          className="mt-4 block w-full text-center text-sm text-neutral-500 hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cooldown > 0 ? `Reenviar código (${cooldown}s)` : isResending ? "Reenviando…" : "Reenviar código"}
        </button>

        <button
          type="button"
          onClick={() => logout().then(() => navigate("/login"))}
          className="mt-2 block w-full text-center text-xs text-neutral-400 hover:text-brand-ink"
        >
          Sair e entrar com outra conta
        </button>
      </AuthLayout>
    </>
  );
}
