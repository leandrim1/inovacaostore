import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { AccountBreadcrumb } from "../../components/account/AccountBreadcrumb";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
  type AddressInput,
  type CustomerAddress,
} from "../../hooks/useAddresses";
import { formatCep } from "../../lib/shipping";
import { useCepAutofill } from "../../hooks/useCepAutofill";
import { formatPhoneBR, maskPhoneBR } from "../../lib/format";

/**
 * Caderninho de endereços do cliente.
 *
 * Os pedidos antigos NÃO seguem o que for editado aqui: cada pedido guarda a
 * própria cópia do endereço, então corrigir o número de casa não reescreve
 * para onde a compra do mês passado foi enviada.
 */

const VAZIO: AddressInput = {
  label: "",
  recipient: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  isDefault: false,
};

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function AddressForm({
  inicial,
  onCancel,
  onSubmit,
  isSaving,
  error,
}: {
  inicial: AddressInput;
  onCancel: () => void;
  onSubmit: (data: AddressInput) => void;
  isSaving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<AddressInput>(inicial);
  const set = (campo: keyof AddressInput, valor: string | boolean) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const numeroRef = useRef<HTMLInputElement>(null);
  const ruaRef = useRef<HTMLInputElement>(null);

  const cep = useCepAutofill((endereco) => {
    setForm((atual) => ({
      ...atual,
      // Rua e bairro vazios acontecem em CEP de cidade inteira: nesses casos
      // o que a pessoa já digitou vale mais que o vazio que veio da consulta.
      street: endereco.street || atual.street,
      neighborhood: endereco.neighborhood || atual.neighborhood,
      city: endereco.city,
      state: endereco.state,
    }));
    // Leva o cursor para o próximo campo que a consulta não tem como saber:
    // o número da casa (ou a rua, quando o CEP não trouxe logradouro).
    (endereco.street ? numeroRef : ruaRef).current?.focus();
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-6"
    >
      <label className="flex flex-col gap-1.5 text-sm sm:col-span-3">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Apelido</span>
        <input
          name="label"
          value={form.label}
          onChange={(e) => set("label", e.target.value)}
          placeholder="Minha casa, Trabalho…"
          maxLength={40}
          className="input-field"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-3">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Quem recebe</span>
        <input
          name="recipient"
          value={form.recipient}
          onChange={(e) => set("recipient", e.target.value)}
          placeholder="Nome de quem recebe"
          maxLength={80}
          autoComplete="name"
          className="input-field"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-neutral-500">
          CEP *
          {cep.buscando && (
            <span className="flex items-center gap-1 normal-case tracking-normal text-neutral-400">
              <Loader2 size={12} className="animate-spin motion-reduce:animate-none" aria-hidden />
              buscando…
            </span>
          )}
        </span>
        <input
          required
          name="cep"
          value={form.cep}
          onChange={(e) => {
            const formatado = formatCep(e.target.value);
            set("cep", formatado);
            void cep.buscar(formatado);
          }}
          placeholder="00000-000"
          inputMode="numeric"
          autoComplete="postal-code"
          className="input-field"
        />
        {/* Erro de CEP nunca trava o formulário: a pessoa continua podendo
            digitar o endereço à mão e salvar. */}
        {cep.erro && <span className="text-xs text-amber-600">{cep.erro} Preencha abaixo.</span>}
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-4">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Endereço *</span>
        <input
          ref={ruaRef}
          required
          name="street"
          value={form.street}
          onChange={(e) => set("street", e.target.value)}
          autoComplete="address-line1"
          className="input-field"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Número *</span>
        <input
          ref={numeroRef}
          required
          name="number"
          value={form.number}
          onChange={(e) => set("number", e.target.value)}
          className="input-field"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-4">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Complemento</span>
        <input
          name="complement"
          value={form.complement}
          onChange={(e) => set("complement", e.target.value)}
          placeholder="Apto, bloco, referência"
          className="input-field"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-3">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Bairro *</span>
        <input
          required
          name="neighborhood"
          value={form.neighborhood}
          onChange={(e) => set("neighborhood", e.target.value)}
          className="input-field"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Cidade *</span>
        <input required name="city"
          value={form.city} onChange={(e) => set("city", e.target.value)} className="input-field" />
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500">UF *</span>
        <select
          required
          name="state"
          value={form.state}
          onChange={(e) => set("state", e.target.value)}
          className="input-field"
        >
          <option value="">–</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-3">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Telefone para a entrega</span>
        <input
          name="phone"
          value={form.phone}
          onChange={(e) => set("phone", maskPhoneBR(e.target.value))}
          placeholder="(34) 99999-9999"
          inputMode="tel"
          autoComplete="tel"
          className="input-field"
        />
      </label>

      <label className="flex items-center gap-2 text-sm sm:col-span-3 sm:self-end sm:pb-3">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
          className="h-4 w-4 accent-brand-ink"
        />
        Usar como endereço padrão
      </label>

      {error && <p className="alert-error sm:col-span-6">{error}</p>}

      <div className="flex flex-wrap gap-3 sm:col-span-6">
        <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-60">
          {isSaving ? "Salvando…" : "Salvar endereço"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function AddressesPage() {
  const { data: addresses = [], isLoading } = useAddresses();
  const criar = useCreateAddress();
  const atualizar = useUpdateAddress();
  const tornarPadrao = useSetDefaultAddress();
  const apagar = useDeleteAddress();
  const confirmDialog = useConfirmDialog();

  const [editando, setEditando] = useState<CustomerAddress | "novo" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(data: AddressInput) {
    setErro(null);
    try {
      if (editando === "novo") await criar.mutateAsync(data);
      else if (editando) await atualizar.mutateAsync({ id: editando.id, ...data });
      setEditando(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar o endereço.");
    }
  }

  function remover(address: CustomerAddress) {
    confirmDialog.ask({
      title: "Excluir endereço",
      description: `Remover "${address.label || address.street}" dos endereços salvos? Seus pedidos já feitos não mudam — cada um guarda o endereço usado na época.`,
      confirmLabel: "Excluir",
      onConfirm: async () => {
        setErro(null);
        try {
          await apagar.mutateAsync(address.id);
        } catch (err) {
          setErro(err instanceof Error ? err.message : "Não foi possível excluir o endereço.");
        }
      },
    });
  }

  return (
    <>
      <Seo title="Endereços" description="Gerencie seus endereços de entrega na Inovação Store." />
      <div className="container-page py-10 sm:py-14">
        <AccountBreadcrumb current="Endereços" />
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="section-title">Endereços</h1>
          {editando === null && (
            <button type="button" onClick={() => setEditando("novo")} className="btn-accent">
              <Plus size={16} /> Novo endereço
            </button>
          )}
        </div>

        {erro && <p className="alert-error mb-4">{erro}</p>}

        {editando !== null && (
          <section className="mb-6 rounded-2xl border border-brand-ink/10 bg-white p-5 sm:p-6">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">
              {editando === "novo" ? "NOVO ENDEREÇO" : "EDITAR ENDEREÇO"}
            </h2>
            <AddressForm
              // `key` remonta o formulário ao trocar de endereço: sem isso o
              // estado interno do anterior vazaria para o próximo.
              key={editando === "novo" ? "novo" : editando.id}
              inicial={
                editando === "novo"
                  ? VAZIO
                  : {
                      label: editando.label,
                      recipient: editando.recipient,
                      phone: maskPhoneBR(editando.phone),
                      cep: formatCep(editando.cep),
                      street: editando.street,
                      number: editando.number,
                      complement: editando.complement,
                      neighborhood: editando.neighborhood,
                      city: editando.city,
                      state: editando.state,
                      isDefault: editando.isDefault,
                    }
              }
              onCancel={() => {
                setEditando(null);
                setErro(null);
              }}
              onSubmit={salvar}
              isSaving={criar.isPending || atualizar.isPending}
              error={null}
            />
          </section>
        )}

        {isLoading ? (
          <p className="text-neutral-400">Carregando…</p>
        ) : addresses.length === 0 ? (
          editando === null && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-brand-ink/10 bg-neutral-50 py-20 text-center text-neutral-500">
              <MapPin size={40} strokeWidth={1.25} />
              <p className="text-sm">
                Você ainda não salvou nenhum endereço.
                <br />
                Salve um e ele já vem preenchido na próxima compra.
              </p>
              <button type="button" onClick={() => setEditando("novo")} className="btn-primary">
                Cadastrar endereço
              </button>
            </div>
          )
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addresses.map((address) => (
              <li
                key={address.id}
                className={`flex flex-col gap-3 rounded-2xl border bg-white p-5 ${
                  address.isDefault ? "border-brand-yellow-dark/40 bg-brand-cream/40" : "border-brand-ink/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-sm tracking-[0.12em] text-brand-ink">
                    {address.label || "Endereço"}
                  </p>
                  {address.isDefault && (
                    <span className="shrink-0 rounded-full bg-brand-yellow px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-brand-ink">
                      PADRÃO
                    </span>
                  )}
                </div>

                <address className="flex-1 text-sm not-italic leading-relaxed text-neutral-600">
                  {address.recipient && (
                    <>
                      <span className="font-medium text-brand-ink">{address.recipient}</span>
                      <br />
                    </>
                  )}
                  {address.street}, {address.number}
                  {address.complement && ` — ${address.complement}`}
                  <br />
                  {address.neighborhood} · {address.city}/{address.state}
                  <br />
                  CEP {formatCep(address.cep)}
                  {address.phone && (
                    <>
                      <br />
                      {formatPhoneBR(address.phone)}
                    </>
                  )}
                </address>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-black/5 pt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(address);
                      setErro(null);
                    }}
                    className="font-medium text-brand-ink underline-offset-4 hover:underline"
                  >
                    Editar
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => tornarPadrao.mutate(address.id)}
                      className="flex items-center gap-1 font-medium text-brand-ink underline-offset-4 hover:underline"
                    >
                      <Star size={13} /> Tornar padrão
                    </button>
                  )}
                  {/* Excluir também no padrão: esconder aqui deixaria quem tem
                      um endereço só sem saída. A rota reelege o mais antigo
                      que sobrar, então a conta nunca fica sem padrão. */}
                  <button
                    type="button"
                    onClick={() => remover(address)}
                    className="flex items-center gap-1 font-medium text-red-600 underline-offset-4 hover:underline"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-xs text-neutral-400">
          Editar um endereço aqui não muda os pedidos já feitos — cada pedido guarda o endereço usado na época.
        </p>

        <div className="mt-8">
          <Link to="/minha-conta" className="text-sm font-medium text-brand-ink underline-offset-4 hover:underline">
            ← Voltar para minha conta
          </Link>
        </div>
      </div>
      <ConfirmDialog {...confirmDialog.dialogProps} />
    </>
  );
}
