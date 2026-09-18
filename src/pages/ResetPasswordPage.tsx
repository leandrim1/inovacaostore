import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { AuthLayout } from "../components/layout/AuthLayout";
import { PasswordInput } from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passwordValid = passwordChecks.length && passwordChecks.letter && passwordChecks.number;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Link de redefinição inválido.");
      return;
    }
    if (!passwordValid) {
      setError("A senha não atende aos requisitos mínimos.");
      return;
    }
    if (!passwordsMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(token, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <>
      <Seo title="Redefinir senha" description="Escolha uma nova senha para sua conta." />
      <AuthLayout eyebrow="Nova senha" title="Redefinir senha">
        {done ? (
          <>
            <p className="text-sm leading-relaxed text-green-700">
              Sua senha foi alterada com sucesso. Você já pode entrar com a nova senha.
            </p>
            <button type="button" onClick={() => navigate("/login")} className="btn-primary mt-6 w-full">
              Ir para o login
            </button>
          </>
        ) : !token ? (
          <p className="text-sm text-red-600">
            Este link de redefinição é inválido. Solicite um novo em "Esqueci minha senha".
          </p>
        ) : (
          <>
            <p className="mb-5 text-sm text-neutral-500">Escolha sua nova senha.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <PasswordInput
                placeholder="Nova senha"
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
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />

              {error && <p className="alert-error">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 w-full disabled:opacity-60">
                {isSubmitting ? "Salvando…" : "Redefinir senha"}
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

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-green-700" : "text-neutral-400"}`}>
      {ok ? <Check size={12} /> : <X size={12} />}
      {label}
    </li>
  );
}
