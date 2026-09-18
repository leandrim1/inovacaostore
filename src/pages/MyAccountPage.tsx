import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, KeyRound, LogOut, PackageSearch, ShieldAlert, User } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { PasswordInput } from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";

export default function MyAccountPage() {
  const { user, logout, changePassword } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
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

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  if (!user) return null;

  return (
    <>
      <Seo title="Minha conta" description="Gerencie os dados da sua conta na Inovação Store." />
      <div className="container-page py-10 sm:py-14">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="h-px w-8 bg-brand-ink/20" aria-hidden />
          <span className="font-display text-xs tracking-[0.35em] text-brand-yellow-dark">Área do cliente</span>
        </div>
        <h1 className="section-title mb-8">Minha conta</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <section className="rounded-2xl border border-brand-ink/10 bg-white p-5 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-sm tracking-widest text-neutral-500">
                <User size={16} /> DADOS DA CONTA
              </h2>
              <div className="flex flex-col gap-1 text-sm">
                <p>
                  <span className="text-neutral-500">Nome: </span>
                  <span className="font-medium text-brand-ink">{user.name}</span>
                </p>
                <p>
                  <span className="text-neutral-500">E-mail: </span>
                  <span className="font-medium text-brand-ink">{user.email}</span>
                </p>
                <p className="mt-1 flex items-center gap-1.5">
                  {user.emailVerified ? (
                    <span className="flex items-center gap-1.5 text-green-700">
                      <BadgeCheck size={16} /> E-mail verificado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <ShieldAlert size={16} /> E-mail não verificado
                    </span>
                  )}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-brand-ink/10 bg-white p-5 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-sm tracking-widest text-neutral-500">
                <KeyRound size={16} /> ALTERAR SENHA
              </h2>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-3 sm:max-w-sm">
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
                {success && <p className="alert-success">Senha alterada com sucesso.</p>}
                <button type="submit" disabled={isSubmitting} className="btn-primary mt-1 w-full disabled:opacity-60">
                  {isSubmitting ? "Salvando…" : "Alterar senha"}
                </button>
              </form>
            </section>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/meus-pedidos"
              className="flex items-center gap-3 rounded-2xl border border-brand-ink/10 bg-white p-5 text-sm font-medium text-brand-ink transition-colors hover:border-brand-ink/30"
            >
              <PackageSearch size={18} /> Meus pedidos
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-2xl border border-brand-ink/10 bg-white p-5 text-left text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
            >
              <LogOut size={18} /> Sair da conta
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
