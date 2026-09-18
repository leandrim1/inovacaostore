import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useFinanceSettings,
  useUpdateExpense,
  useUpdateFinanceSettings,
  type Expense,
  type ExpenseCategory,
  type ExpenseInput,
  type FinanceSettingsInput,
} from "../../hooks/admin/useAdminFinance";
import { formatBRL } from "../../lib/format";

const inputClass = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink";
const labelClass = "text-xs font-medium text-neutral-500";
const sectionClass = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  embalagem: "Embalagem",
  marketing: "Marketing",
  comissao: "Comissão",
  operacional: "Operacional",
  outro: "Outro",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_EXPENSE_DRAFT: ExpenseInput = { category: "outro", description: "", amount: 0, occurredAt: todayIso() };

export default function AdminFinanceSettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useFinanceSettings();
  const updateSettings = useUpdateFinanceSettings();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [paymentFeePixPct, setPaymentFeePixPct] = useState("0");
  const [paymentFeeCardPct, setPaymentFeeCardPct] = useState("0");
  const [paymentFeeBoletoPct, setPaymentFeeBoletoPct] = useState("0");
  const [paymentFeeOtherPct, setPaymentFeeOtherPct] = useState("0");
  const [platformFeePct, setPlatformFeePct] = useState("0");
  const [includeCancelledOrders, setIncludeCancelledOrders] = useState(false);
  const [includeRefundedOrders, setIncludeRefundedOrders] = useState(false);

  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [newExpense, setNewExpense] = useState<ExpenseInput>(EMPTY_EXPENSE_DRAFT);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ExpenseInput>(EMPTY_EXPENSE_DRAFT);

  useEffect(() => {
    if (!settings) return;
    setPaymentFeePixPct(String(settings.paymentFeePixPct));
    setPaymentFeeCardPct(String(settings.paymentFeeCardPct));
    setPaymentFeeBoletoPct(String(settings.paymentFeeBoletoPct));
    setPaymentFeeOtherPct(String(settings.paymentFeeOtherPct));
    setPlatformFeePct(String(settings.platformFeePct));
    setIncludeCancelledOrders(settings.includeCancelledOrders);
    setIncludeRefundedOrders(settings.includeRefundedOrders);
  }, [settings]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSaved(false);

    const payload: FinanceSettingsInput = {
      paymentFeePixPct: Number(paymentFeePixPct),
      paymentFeeCardPct: Number(paymentFeeCardPct),
      paymentFeeBoletoPct: Number(paymentFeeBoletoPct),
      paymentFeeOtherPct: Number(paymentFeeOtherPct),
      platformFeePct: Number(platformFeePct),
      includeCancelledOrders,
      includeRefundedOrders,
    };

    try {
      await updateSettings.mutateAsync(payload);
      setSettingsSaved(true);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Não foi possível salvar as configurações.");
    }
  }

  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();
    setExpenseError(null);
    try {
      await createExpense.mutateAsync(newExpense);
      setNewExpense(EMPTY_EXPENSE_DRAFT);
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : "Não foi possível registrar a despesa.");
    }
  }

  function startEditExpense(expense: Expense) {
    setEditingId(expense.id);
    setEditDraft({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      occurredAt: expense.occurredAt.slice(0, 10),
    });
  }

  async function saveEditExpense(id: string) {
    setExpenseError(null);
    try {
      await updateExpense.mutateAsync({ id, data: editDraft });
      setEditingId(null);
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : "Não foi possível salvar a despesa.");
    }
  }

  async function handleDeleteExpense(expense: Expense) {
    if (!confirm(`Excluir a despesa "${expense.description || CATEGORY_LABELS[expense.category]}"?`)) return;
    setExpenseError(null);
    try {
      await deleteExpense.mutateAsync(expense.id);
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : "Não foi possível excluir a despesa.");
    }
  }

  if (settingsLoading) {
    return <p className="text-neutral-400">Carregando…</p>;
  }

  const isSavingSettings = updateSettings.isPending;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl tracking-wide">Financeiro</h1>
      <p className="-mt-4 text-sm text-neutral-500">
        Taxas e despesas configuradas aqui entram no cálculo de lucro líquido do dashboard de vendas.
      </p>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className={sectionClass}>
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">TAXAS DE PAGAMENTO</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                Pix (%)
                <input type="number" step="0.01" min={0} value={paymentFeePixPct} onChange={(e) => setPaymentFeePixPct(e.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                Cartão (%)
                <input type="number" step="0.01" min={0} value={paymentFeeCardPct} onChange={(e) => setPaymentFeeCardPct(e.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                Boleto (%)
                <input type="number" step="0.01" min={0} value={paymentFeeBoletoPct} onChange={(e) => setPaymentFeeBoletoPct(e.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                Outros métodos (%)
                <input type="number" step="0.01" min={0} value={paymentFeeOtherPct} onChange={(e) => setPaymentFeeOtherPct(e.target.value)} className={inputClass} />
              </label>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Percentual sobre o valor do pedido, descontado do lucro conforme a forma de pagamento usada.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">TAXA DA PLATAFORMA</h2>
            <label className={labelClass}>
              Comissão da plataforma (%)
              <input type="number" step="0.01" min={0} value={platformFeePct} onChange={(e) => setPlatformFeePct(e.target.value)} className={inputClass} />
            </label>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">
              PEDIDOS CANCELADOS E REEMBOLSADOS
            </h2>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-brand-ink">
                <input
                  type="checkbox"
                  checked={includeCancelledOrders}
                  onChange={(e) => setIncludeCancelledOrders(e.target.checked)}
                  className="h-4 w-4 accent-brand-ink"
                />
                Contar pedidos cancelados como venda efetiva
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-brand-ink">
                <input
                  type="checkbox"
                  checked={includeRefundedOrders}
                  onChange={(e) => setIncludeRefundedOrders(e.target.checked)}
                  className="h-4 w-4 accent-brand-ink"
                />
                Contar pedidos reembolsados como venda efetiva
              </label>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Por padrão, pedidos cancelados e reembolsados não entram no faturamento nem no lucro do
              dashboard.
            </p>
          </section>
        </div>

        <div className="h-fit rounded-2xl bg-brand-cream p-5">
          {settingsError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{settingsError}</p>}
          {settingsSaved && !isSavingSettings && (
            <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Configurações salvas com sucesso.</p>
          )}
          <button type="submit" disabled={isSavingSettings} className="btn-primary w-full disabled:opacity-60">
            {isSavingSettings ? "Salvando…" : "Salvar configurações"}
          </button>
        </div>
      </form>

      <section className={sectionClass}>
        <h2 className="mb-1 font-display text-sm tracking-widest text-neutral-500">CUSTOS E DESPESAS</h2>
        <p className="mb-4 text-xs text-neutral-400">
          Embalagens, marketing, comissões, despesas operacionais e outros custos que não são
          automáticos — cada um entra no lucro do período em que ocorreu.
        </p>

        <form onSubmit={handleCreateExpense} className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-3 sm:grid-cols-6">
          <select
            value={newExpense.category}
            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })}
            className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <input
            placeholder="Descrição"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            className="col-span-2 rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
          />
          <input
            type="number"
            min={0}
            step="0.01"
            required
            placeholder="Valor (R$)"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
            className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
          />
          <input
            type="date"
            required
            value={newExpense.occurredAt}
            onChange={(e) => setNewExpense({ ...newExpense, occurredAt: e.target.value })}
            className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
          />
          <button type="submit" className="btn-primary col-span-2 justify-center sm:col-span-6">
            <Plus size={16} /> Adicionar despesa
          </button>
        </form>

        {expenseError && <p className="mb-3 text-sm text-red-600">{expenseError}</p>}

        <div className="hidden overflow-x-auto rounded-xl ring-1 ring-black/5 sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
                <th className="py-3 pl-4 pr-3">Categoria</th>
                <th className="py-3 pr-3">Descrição</th>
                <th className="py-3 pr-3">Valor</th>
                <th className="py-3 pr-3">Data</th>
                <th className="py-3 pr-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {expensesLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">
                    Carregando…
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">
                    Nenhuma despesa registrada.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-black/5 last:border-0">
                    {editingId === expense.id ? (
                      <>
                        <td className="py-2 pl-4 pr-3">
                          <select
                            value={editDraft.category}
                            onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value as ExpenseCategory })}
                            className="rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-brand-ink"
                          >
                            {EXPENSE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {CATEGORY_LABELS[c]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            value={editDraft.description}
                            onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                            className="w-40 rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-brand-ink"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            step="0.01"
                            value={editDraft.amount}
                            onChange={(e) => setEditDraft({ ...editDraft, amount: Number(e.target.value) })}
                            className="w-24 rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-brand-ink"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="date"
                            value={editDraft.occurredAt}
                            onChange={(e) => setEditDraft({ ...editDraft, occurredAt: e.target.value })}
                            className="rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-brand-ink"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button type="button" onClick={() => saveEditExpense(expense.id)} className="rounded-lg p-2 text-green-600 hover:bg-green-50">
                              <Check size={16} />
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100">
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 pl-4 pr-3 font-medium text-brand-ink">{CATEGORY_LABELS[expense.category]}</td>
                        <td className="py-2.5 pr-3 text-neutral-600">{expense.description || "—"}</td>
                        <td className="py-2.5 pr-3">{formatBRL(expense.amount)}</td>
                        <td className="py-2.5 pr-3 text-neutral-500">
                          {new Date(expense.occurredAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditExpense(expense)}
                              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(expense)}
                              className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:hidden">
          {expensesLoading ? (
            <div className="rounded-xl p-6 text-center text-sm text-neutral-400 ring-1 ring-black/5">Carregando…</div>
          ) : expenses.length === 0 ? (
            <div className="rounded-xl p-6 text-center text-sm text-neutral-400 ring-1 ring-black/5">
              Nenhuma despesa registrada.
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="rounded-xl p-4 ring-1 ring-black/5">
                {editingId === expense.id ? (
                  <div className="flex flex-col gap-2">
                    <select
                      value={editDraft.category}
                      onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value as ExpenseCategory })}
                      className="rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink"
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </select>
                    <input
                      value={editDraft.description}
                      onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                      placeholder="Descrição"
                      className="rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editDraft.amount}
                        onChange={(e) => setEditDraft({ ...editDraft, amount: Number(e.target.value) })}
                        placeholder="Valor (R$)"
                        className="rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink"
                      />
                      <input
                        type="date"
                        value={editDraft.occurredAt}
                        onChange={(e) => setEditDraft({ ...editDraft, occurredAt: e.target.value })}
                        className="rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => saveEditExpense(expense.id)} className="rounded-lg p-2 text-green-600 hover:bg-green-50">
                        <Check size={16} />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-brand-ink">{CATEGORY_LABELS[expense.category]}</p>
                        <p className="text-xs text-neutral-500">{expense.description || "—"}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditExpense(expense)}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense)}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-600">
                      <span>{new Date(expense.occurredAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</span>
                      <span className="font-medium text-brand-ink">{formatBRL(expense.amount)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
