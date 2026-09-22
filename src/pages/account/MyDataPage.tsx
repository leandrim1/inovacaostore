import { useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AccountBreadcrumb } from "../../components/account/AccountBreadcrumb";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { useAuth } from "../../context/AuthContext";
import { maskPhoneBR } from "../../lib/format";

/**
 * "Meus dados": o que o cliente pode mesmo mudar sozinho.
 *
 * O e-mail aparece travado porque é a identidade da conta — trocá-lo exige
 * reverificação, e sem isso bastaria digitar o e-mail de outra pessoa. O
 * cadastro da loja não pede CPF nem data de nascimento, então esses campos
 * não aparecem aqui: campo que a loja não usa é formulário mais longo sem
 * nada em troca.
 */

function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(maskPhoneBR(user?.phone ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setIsSaving(true);
    const result = await updateProfile({ name: name.trim(), phone });
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="text-xs uppercase tracking-wide text-neutral-500">E-mail</span>
        <input value={user?.email ?? ""} readOnly disabled className="input-field bg-neutral-50 text-neutral-500" />
        <span className="text-xs text-neutral-400">
          O e-mail é o login da conta e não pode ser trocado por aqui. Precisa mudar? Fale com a loja.
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Nome completo *</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
          className="input-field"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Telefone / WhatsApp</span>
        <input
          value={phone}
          onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
          placeholder="(34) 99999-9999"
          inputMode="tel"
          autoComplete="tel"
          className="input-field"
        />
      </label>

      {error && <p className="alert-error sm:col-span-2">{error}</p>}
      {saved && <p className="alert-success sm:col-span-2">Dados atualizados.</p>}

      <div className="sm:col-span-2">
        <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-60">
          {isSaving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("As novas senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:max-w-sm">
      <PasswordInput
        placeholder="Senha atual"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <PasswordInput
        placeholder="Nova senha"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        required
      />
      <PasswordInput
        placeholder="Confirmar nova senha"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
      />
      {error && <p className="alert-error">{error}</p>}
      {success && (
        <p className="alert-success">
          Senha alterada. As outras sessões abertas foram desconectadas.
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className="btn-primary mt-1 w-full disabled:opacity-60">
        {isSubmitting ? "Salvando…" : "Alterar senha"}
      </button>
    </form>
  );
}

export default function MyDataPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <Seo title="Meus dados" description="Atualize os dados da sua conta na Inovação Store." />
      <div className="container-page py-10 sm:py-14">
        <AccountBreadcrumb current="Meus dados" />
        <h1 className="section-title mb-8">Meus dados</h1>

        <div className="flex flex-col gap-6 lg:max-w-3xl">
          <section className="rounded-2xl border border-brand-ink/10 bg-white p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-sm tracking-widest text-neutral-500">DADOS PESSOAIS</h2>
              {user.emailVerified ? (
                <span className="flex items-center gap-1.5 text-xs text-green-700">
                  <BadgeCheck size={15} /> E-mail verificado
                </span>
              ) : (
                <Link
                  to="/verificar-email"
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-600 underline-offset-4 hover:underline"
                >
                  <ShieldAlert size={15} /> Confirmar e-mail
                </Link>
              )}
            </div>
            <ProfileForm />
          </section>

          <section className="rounded-2xl border border-brand-ink/10 bg-white p-5 sm:p-6">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">ALTERAR SENHA</h2>
            <PasswordForm />
          </section>
        </div>

        <div className="mt-8">
          <Link to="/minha-conta" className="text-sm font-medium text-brand-ink underline-offset-4 hover:underline">
            ← Voltar para minha conta
          </Link>
        </div>
      </div>
    </>
  );
}
