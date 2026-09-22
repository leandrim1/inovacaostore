import { useState } from "react";
import {
  useAdminSettings,
  useUpdateBenefits,
  type AdminSiteSettings,
  type BenefitsInput,
} from "../../hooks/admin/useAdminSettings";
import { BENEFIT_ICONS, benefitIcon } from "../../lib/benefitIcons";

interface BenefitForm {
  icon: string;
  title: string;
  text: string;
}

const BENEFIT_TITLE_MAX = 40;
const BENEFIT_TEXT_MAX = 140;

function fromSettings(s: AdminSiteSettings): BenefitForm[] {
  return [
    { icon: s.benefit1Icon, title: s.benefit1Title, text: s.benefit1Text },
    { icon: s.benefit2Icon, title: s.benefit2Title, text: s.benefit2Text },
    { icon: s.benefit3Icon, title: s.benefit3Title, text: s.benefit3Text },
    { icon: s.benefit4Icon, title: s.benefit4Title, text: s.benefit4Text },
  ];
}

export default function AdminBenefitsPage() {
  const { data: settings, isLoading, isError } = useAdminSettings();

  if (isLoading) {
    return <p className="text-neutral-400">Carregando…</p>;
  }
  if (isError || !settings) {
    return <p className="alert-error">Não foi possível carregar os benefícios. Recarregue a página.</p>;
  }
  // O formulário só nasce com os dados em mãos: começa preenchido, sem um
  // render intermediário vazio.
  return <BenefitsForm initial={settings} />;
}

function BenefitsForm({ initial }: { initial: AdminSiteSettings }) {
  const updateBenefits = useUpdateBenefits();
  const [benefits, setBenefits] = useState(() => fromSettings(initial));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function updateBenefit(index: number, patch: Partial<BenefitForm>) {
    setBenefits((atual) => atual.map((b, i) => (i === index ? { ...b, ...patch } : b)));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    // `required` do navegador aceita um campo só com espaços; o servidor
    // recusaria com um "Dados inválidos." genérico. Melhor dizer qual é.
    const vazio = benefits.findIndex((b) => !b.title.trim() || !b.text.trim());
    if (vazio !== -1) {
      setError(`Preencha o título e o texto do benefício ${vazio + 1}.`);
      return;
    }
    const [b1, b2, b3, b4] = benefits;
    const payload: BenefitsInput = {
      benefit1Icon: b1.icon,
      benefit1Title: b1.title,
      benefit1Text: b1.text,
      benefit2Icon: b2.icon,
      benefit2Title: b2.title,
      benefit2Text: b2.text,
      benefit3Icon: b3.icon,
      benefit3Title: b3.title,
      benefit3Text: b3.text,
      benefit4Icon: b4.icon,
      benefit4Title: b4.title,
      benefit4Text: b4.text,
    };

    try {
      const atualizado = await updateBenefits.mutateAsync(payload);
      // O servidor apara espaços nas pontas: o formulário mostra o que ficou gravado.
      setBenefits(fromSettings(atualizado));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar os benefícios.");
    }
  }

  const isSaving = updateBenefits.isPending;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl tracking-wide">Benefícios</h1>
      <p className="-mt-4 text-sm text-neutral-500">
        Os 4 itens com ícone que aparecem na página inicial, logo abaixo dos produtos em destaque.
        Alterações aqui aparecem para os clientes assim que salvar.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {benefits.map((b, i) => {
            const Icon = benefitIcon(b.icon);
            return (
              <section key={i} className="min-w-0 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">
                  BENEFÍCIO {String(i + 1).padStart(2, "0")}
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  <label className="text-xs font-medium text-neutral-500">
                    Ícone
                    <span className="mt-1 flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-brand-cream text-brand-yellow-dark"
                      >
                        <Icon size={18} strokeWidth={1.75} />
                      </span>
                      <select
                        name={`benefit${i + 1}Icon`}
                        value={b.icon}
                        onChange={(e) => updateBenefit(i, { icon: e.target.value })}
                        className="min-w-0 flex-1 admin-input px-3 py-2"
                      >
                        {BENEFIT_ICONS.map((opcao) => (
                          <option key={opcao.key} value={opcao.key}>
                            {opcao.label}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                  <label className="text-xs font-medium text-neutral-500">
                    Título
                    <input
                      required
                      name={`benefit${i + 1}Title`}
                      maxLength={BENEFIT_TITLE_MAX}
                      value={b.title}
                      onChange={(e) => updateBenefit(i, { title: e.target.value })}
                      className="mt-1 w-full admin-input px-3 py-2"
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-500">
                    Texto
                    <textarea
                      required
                      name={`benefit${i + 1}Text`}
                      maxLength={BENEFIT_TEXT_MAX}
                      rows={2}
                      value={b.text}
                      onChange={(e) => updateBenefit(i, { text: e.target.value })}
                      className="mt-1 w-full admin-input px-3 py-2"
                    />
                    <span className="mt-1 block text-right font-normal tabular-nums text-neutral-400">
                      {b.text.length}/{BENEFIT_TEXT_MAX}
                    </span>
                  </label>
                </div>
              </section>
            );
          })}
        </div>

        <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          {error && <p className="alert-error">{error}</p>}
          {saved && !error && <p className="alert-success">Benefícios salvos com sucesso.</p>}

          <button type="submit" disabled={isSaving} className="btn-primary w-full disabled:opacity-60">
            {isSaving ? "Salvando…" : "Salvar benefícios"}
          </button>
        </section>
      </form>
    </div>
  );
}
