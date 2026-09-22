import { CheckCircle2, Mail, XCircle } from "lucide-react";
import { useEmailConfig, useSendTestEmail } from "../../hooks/admin/useAdminSettings";

/**
 * Diagnóstico do envio de e-mail (código de verificação e redefinição de
 * senha).
 *
 * A configuração mora nas variáveis de ambiente da Vercel, que ninguém vê
 * pelo site. Quando um cliente diz "o código não chegou", este cartão
 * responde na hora se o problema é variável faltando, senha recusada ou
 * servidor inalcançável — e diz o que fazer em cada caso.
 */
export function EmailDiagnostic() {
  const { data: config, isLoading } = useEmailConfig();
  const teste = useSendTestEmail();
  const resultado = teste.data;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-sm tracking-widest text-neutral-500">
            <Mail size={16} /> ENVIO DE E-MAIL
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            Usado no código de verificação do cadastro e no link de redefinição de senha.
          </p>
        </div>
        {!isLoading && config && (
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              config.configured ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {config.configured ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {config.configured ? "Configurado" : "Não configurado"}
          </span>
        )}
      </div>

      {config && (
        <dl className="mb-4 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-neutral-400">Servidor:</dt>
            <dd className="font-mono text-xs leading-5 text-brand-ink">
              {config.host}:{config.port}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-neutral-400">Conta:</dt>
            <dd className="font-mono text-xs leading-5 text-brand-ink">{config.user ?? "— (SMTP_USER vazio)"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-neutral-400">Senha:</dt>
            {/* Só "definida" ou não: nem o tamanho da senha sai do servidor. */}
            <dd className="text-xs leading-5 text-brand-ink">
              {config.hasPassword ? "definida" : "— (SMTP_PASSWORD vazio)"}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-neutral-400">Remetente:</dt>
            <dd className="text-xs leading-5 text-brand-ink">{config.fromName}</dd>
          </div>
        </dl>
      )}

      <button
        type="button"
        onClick={() => teste.mutate()}
        disabled={teste.isPending}
        className="rounded-lg bg-brand-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {teste.isPending ? "Enviando teste…" : "Enviar e-mail de teste para mim"}
      </button>

      {resultado?.ok === true && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Enviado para <strong>{resultado.to}</strong>. Se chegou, os clientes estão recebendo o código. Se não
          aparecer em alguns minutos, confira o spam — o problema aí é entrega, não configuração.
        </p>
      )}

      {resultado?.ok === false && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <p className="font-medium">O envio falhou — é por isso que o código não chega.</p>
          <p className="mt-1">{resultado.hint}</p>
          {resultado.detail && (
            <p className="mt-2 break-all font-mono text-xs text-red-700/80">Resposta do servidor: {resultado.detail}</p>
          )}
        </div>
      )}

      {teste.isError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {teste.error instanceof Error ? teste.error.message : "Não foi possível executar o teste."}
        </p>
      )}
    </section>
  );
}
