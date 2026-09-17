import { useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../components/seo/Seo";
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
      <div className="container-page flex min-h-[70vh] items-center justify-center py-14">
        <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5">
          <h1 className="section-title mb-1 text-2xl">Esqueci minha senha</h1>

          {sent ? (
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              Se existir uma conta com esse e-mail, enviamos um link para redefinir sua senha. Confira
              sua caixa de entrada (e o spam).
            </p>
          ) : (
            <>
              <p className="mb-6 text-sm text-neutral-500">
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
                  className="rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
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
        </div>
      </div>
    </>
  );
}
