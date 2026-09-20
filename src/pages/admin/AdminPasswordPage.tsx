import { useState } from "react";
import { Check, Eye, EyeOff, KeyRound, ShieldCheck, X } from "lucide-react";
import { api } from "../../lib/api";
import { useAdminAuth } from "../../context/AdminAuthContext";

/**
 * Regras conferidas ao vivo enquanto a pessoa digita. São as MESMAS do
 * servidor (adminPasswordSchema em server/src/routes/auth.routes.ts) — aqui
 * só para orientar; quem decide é sempre o backend.
 */
const REGRAS = [
  { texto: "Pelo menos 12 caracteres", testa: (s: string) => s.length >= 12 },
  { texto: "Uma letra minúscula", testa: (s: string) => /[a-z]/.test(s) },
  { texto: "Uma letra maiúscula", testa: (s: string) => /[A-Z]/.test(s) },
  { texto: "Um número", testa: (s: string) => /[0-9]/.test(s) },
];

function CampoSenha({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-600">{label}</span>
      <div className="relative">
        <input
          type={visivel ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="admin-input w-full px-3.5 py-2.5 pr-11"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-400 transition-colors hover:text-brand-ink"
        >
          {visivel ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

export default function AdminPasswordPage() {
  const { admin } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const regrasOk = REGRAS.every((r) => r.testa(newPassword));
  const confirmaBate = newPassword.length > 0 && newPassword === confirmPassword;
  const podeEnviar = currentPassword.length > 0 && regrasOk && confirmaBate && !enviando;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (newPassword !== confirmPassword) {
      setErro("A confirmação não confere com a nova senha.");
      return;
    }

    setEnviando(true);
    try {
      await api.put("/api/admin/auth/password", { currentPassword, newPassword });
      setSucesso(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide">Alterar senha</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Esta é a senha que protege todo o painel e os dados dos seus clientes.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-brand-yellow/10 p-4 ring-1 ring-brand-yellow/30">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-yellow-dark" aria-hidden />
        <p className="text-sm leading-relaxed text-neutral-600">
          Ao alterar a senha, <strong className="text-brand-ink">todos os outros acessos são encerrados</strong> —
          qualquer computador ou celular onde o painel estivesse aberto precisará entrar de novo. Você continua
          conectado aqui.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        {admin && (
          <p className="text-sm text-neutral-500">
            Conta: <strong className="font-medium text-brand-ink">{admin.email}</strong>
          </p>
        )}

        {erro && <p className="alert-error">{erro}</p>}
        {sucesso && (
          <p className="alert-success">Senha alterada com sucesso. Os outros acessos foram encerrados.</p>
        )}

        <CampoSenha
          label="Senha atual"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
        />

        <CampoSenha
          label="Nova senha"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />

        <ul className="-mt-2 flex flex-col gap-1.5">
          {REGRAS.map((regra) => {
            const atende = regra.testa(newPassword);
            return (
              <li
                key={regra.texto}
                className={`flex items-center gap-2 text-xs ${
                  atende ? "text-green-700" : newPassword ? "text-neutral-500" : "text-neutral-400"
                }`}
              >
                {atende ? <Check size={14} /> : <X size={14} className="opacity-50" />}
                {regra.texto}
              </li>
            );
          })}
        </ul>

        <CampoSenha
          label="Confirmar nova senha"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        {confirmPassword.length > 0 && !confirmaBate && (
          <p className="-mt-3 text-xs text-red-600">As senhas não conferem.</p>
        )}

        <button type="submit" disabled={!podeEnviar} className="btn-primary w-fit disabled:opacity-50">
          <KeyRound size={16} />
          {enviando ? "Alterando…" : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
