import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useAdminCoupons, useDeleteCoupon, useUpdateCoupon } from "../../hooks/admin/useAdminCoupons";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("pt-BR") : null;
}

function usageLabel(usedCount: number, maxRedemptions: number | null) {
  return maxRedemptions != null ? `${usedCount} / ${maxRedemptions}` : `${usedCount} (sem limite)`;
}

function validityLabel(startsAt: string | null, expiresAt: string | null) {
  const start = formatDate(startsAt);
  const end = formatDate(expiresAt);
  if (!start && !end) return "Sem prazo";
  if (start && end) return `${start} até ${end}`;
  if (end) return `Até ${end}`;
  return `A partir de ${start}`;
}

export default function AdminCouponsPage() {
  const { data: coupons = [], isLoading } = useAdminCoupons();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const [error, setError] = useState<string | null>(null);
  const confirmDialog = useConfirmDialog();

  async function toggleActive(id: string, current: boolean) {
    setError(null);
    try {
      await updateCoupon.mutateAsync({ id, data: { active: !current } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o cupom.");
    }
  }

  function handleDelete(id: string, code: string) {
    confirmDialog.ask({
      title: "Excluir cupom",
      description: `O cupom "${code}" deixará de funcionar imediatamente. Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setError(null);
        try {
          await deleteCoupon.mutateAsync(id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Não foi possível excluir.");
        }
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-wide">Cupons</h1>
        <Link to="/admin/cupons/novo" className="btn-primary">
          <Plus size={16} /> Novo cupom
        </Link>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5 sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
              <th className="py-3 pl-5 pr-4">Código</th>
              <th className="py-3 pr-4">Desconto</th>
              <th className="py-3 pr-4">Validade</th>
              <th className="py-3 pr-4">Usos</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  Carregando…
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  Nenhum cupom cadastrado ainda.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-b border-black/5 last:border-0">
                  <td className="py-3 pl-5 pr-4">
                    <p className="font-mono font-medium text-brand-ink">{c.code}</p>
                    {c.description && <p className="text-xs text-neutral-500">{c.description}</p>}
                  </td>
                  <td className="py-3 pr-4 text-neutral-600">{c.percentOff}% OFF</td>
                  <td className="py-3 pr-4 text-neutral-500">{validityLabel(c.startsAt, c.expiresAt)}</td>
                  <td className="py-3 pr-4 text-neutral-500">{usageLabel(c.usedCount, c.maxRedemptions)}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        c.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {c.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="py-3 pr-5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleActive(c.id, c.active)}
                        title={c.active ? "Desativar" : "Reativar"}
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                      >
                        {c.active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <Link
                        to={`/admin/cupons/${c.id}`}
                        title="Editar"
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id, c.code)}
                        title="Excluir"
                        className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {isLoading ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400 shadow-sm ring-1 ring-black/5">
            Carregando…
          </div>
        ) : coupons.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400 shadow-sm ring-1 ring-black/5">
            Nenhum cupom cadastrado ainda.
          </div>
        ) : (
          coupons.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono font-medium text-brand-ink">{c.code}</p>
                  <p className="text-xs text-neutral-500">{c.percentOff}% OFF</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    c.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {c.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="text-xs text-neutral-500">{validityLabel(c.startsAt, c.expiresAt)}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500">Usos: {usageLabel(c.usedCount, c.maxRedemptions)}</p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleActive(c.id, c.active)}
                    title={c.active ? "Desativar" : "Reativar"}
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                  >
                    {c.active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <Link
                    to={`/admin/cupons/${c.id}`}
                    title="Editar"
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.code)}
                    title="Excluir"
                    className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </div>
  );
}
