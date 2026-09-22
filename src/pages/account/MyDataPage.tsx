import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, ShieldAlert, Trash2 } from "lucide-react";
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

/**
 * Exclusão da conta.
 *
 * Fica atrás de dois passos (abrir a área e digitar a senha) porque é
 * irreversível. A lista do que sai e do que fica é mostrada ANTES de pedir
 * a senha: quem exclui precisa saber que os pedidos continuam registrados
 * na loja, e quem só estava curioso desiste antes de digitar qualquer coisa.
 */
function DeleteAccountSection() {
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExcluindo(true);
    const result = await deleteAccount(password);
    setExcluindo(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:p-6">
      <h2 className="mb-2 flex items-center gap-2 font-display text-sm tracking-widest text-red-700">
        <Trash2 size={16} /> EXCLUIR MINHA CONTA
      </h2>

      {!aberto ? (
        <>
          <p className="mb-4 text-sm text-neutral-600">
            Seus dados pessoais saem da loja e você perde o acesso a esta conta.
          </p>
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="rounded-full border border-red-300 px-5 py-2.5 font-display text-xs tracking-[0.15em] text-red-700 transition-colors hover:bg-red-100"
          >
            EXCLUIR MINHA CONTA
          </button>
        </>
      ) : (
        <form onSubmit={handleDelete} className="flex flex-col gap-4 sm:max-w-md">
          <div className="text-sm text-neutral-600">
            <p className="mb-2 font-medium text-brand-ink">Isto não pode ser desfeito. Ao confirmar:</p>
            <ul className="mb-3 flex list-disc flex-col gap-1 pl-5">
              <li>seu nome, e-mail e telefone saem do cadastro;</li>
              <li>seus endereços salvos são apagados;</li>
              <li>seus depoimentos saem do site;</li>
              <li>você perde o acesso e precisará criar uma conta nova para comprar de novo.</li>
            </ul>
            {/* Dito aqui, e não depois: é o ponto em que a pessoa ainda pode
                desistir sabendo o que realmente acontece. */}
            <p>
              Seus <strong>pedidos continuam registrados</strong> na loja, sem os seus dados pessoais — a
              loja precisa deles para a contabilidade dela.
            </p>
          </div>

          <PasswordInput
            placeholder="Digite sua senha para confirmar"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="alert-error">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={excluindo}
              className="rounded-full bg-red-600 px-6 py-3 font-display text-xs tracking-[0.15em] text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {excluindo ? "EXCLUINDO…" : "CONFIRMAR EXCLUSÃO"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                setPassword("");
                setError(null);
              }}
              className="btn-outline"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
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

          <DeleteAccountSection />
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
