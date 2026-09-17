import { useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../components/seo/Seo";
import { AuthLayout } from "../components/layout/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await forgotPassword(email);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  return (
    <>
      <Seo title="Esqueci minha senha" description="Recupere o acesso à sua conta." />
      <AuthLayout eyebrow="Recuperação de acesso" title="Esqueci minha senha">
        {sent ? (
          <p className="text-sm leading-relaxed text-neutral-600">
            Se existir uma conta com esse e-mail, enviamos um link para redefinir sua senha. Confira
            sua caixa de entrada (e o spam).
          </p>
        ) : (
          <>
            <p className="mb-5 text-sm text-neutral-500">
              Informe o e-mail da sua conta para receber um link de redefinição de senha.
            </p>
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 w-full disabled:opacity-60">
                {isSubmitting ? "Enviando…" : "Enviar link de recuperação"}
              </button>
            </form>
          </>
        )}

        <Link to="/login" className="mt-4 block text-center text-sm text-neutral-500 hover:text-brand-ink">
          Voltar para o login
        </Link>
      </AuthLayout>
    </>
  );
}
