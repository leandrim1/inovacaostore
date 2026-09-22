import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { AuthLayout } from "../components/layout/AuthLayout";
import { PasswordInput } from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";

function useEmailValid(email: string) {
  return useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailValid = useEmailValid(email);
  const passwordChecks = {
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passwordValid = passwordChecks.length && passwordChecks.letter && passwordChecks.number;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const formValid = name.trim().length >= 2 && emailValid && passwordValid && passwordsMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);

    if (!formValid) return;

    setIsSubmitting(true);
    const result = await register(name.trim(), email, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(`/verificar-email?redirect=${encodeURIComponent(redirect)}`, {
      replace: true,
      state: { emailNotSent: result.emailNotSent === true },
    });
  }

  return (
    <>
      <Seo title="Criar conta" description="Crie sua conta na Inovação Store." />
      <AuthLayout
        eyebrow="Junte-se a nós"
        title="Criar conta"
        subtitle="Crie sua conta para acompanhar seus pedidos e agilizar suas compras."
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="input-field"
          />
          {touched && name.trim().length < 2 && (
            <p className="-mt-2 text-xs text-red-600">Informe seu nome completo.</p>
          )}

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="input-field"
          />
          {touched && !emailValid && <p className="-mt-2 text-xs text-red-600">Informe um e-mail válido.</p>}

          <PasswordInput
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {password.length > 0 && (
            <ul className="-mt-1.5 flex flex-col gap-1 pl-1 text-xs">
              <PasswordRule ok={passwordChecks.length} label="Pelo menos 8 caracteres" />
              <PasswordRule ok={passwordChecks.letter} label="Ao menos uma letra" />
              <PasswordRule ok={passwordChecks.number} label="Ao menos um número" />
            </ul>
          )}

          <PasswordInput
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          {touched && confirmPassword.length > 0 && !passwordsMatch && (
            <p className="-mt-2 text-xs text-red-600">As senhas não coincidem.</p>
          )}

          {error && <p className="alert-error">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 w-full disabled:opacity-60">
            {isSubmitting ? "Criando conta…" : "Criar conta"}
          </button>
        </form>

        <Link
          to={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="mt-4 block text-center text-sm text-neutral-500 hover:text-brand-ink"
        >
          Já tem conta? Entrar
        </Link>
      </AuthLayout>
    </>
  );
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-green-700" : "text-neutral-400"}`}>
      {ok ? <Check size={12} /> : <X size={12} />}
      {label}
    </li>
  );
}
