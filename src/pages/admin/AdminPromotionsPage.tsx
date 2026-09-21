import { useState } from "react";
import { Link } from "react-router-dom";
import { formatBRL } from "../../lib/format";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useAdminPromotions, useDeletePromotion, useUpdatePromotion } from "../../hooks/admin/useAdminPromotions";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";

export default function AdminPromotionsPage() {
  const { data: promotions = [], isLoading } = useAdminPromotions();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  const [error, setError] = useState<string | null>(null);
  const confirmDialog = useConfirmDialog();

  async function toggleActive(id: string, current: boolean) {
    setError(null);
    try {
      await updatePromotion.mutateAsync({ id, data: { active: !current } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a promoção.");
    }
  }

  function handleDelete(id: string, title: string) {
    confirmDialog.ask({
      title: "Excluir promoção",
      description: `A promoção "${title}" sai do banner da home na hora. Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setError(null);
        try {
          await deletePromotion.mutateAsync(id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Não foi possível excluir.");
        }
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-wide">Promoções</h1>
        <Link to="/admin/promocoes/novo" className="btn-primary">
          <Plus size={16} /> Nova promoção
        </Link>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5 sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
              <th className="py-3 pl-5 pr-4">Promoção</th>
              <th className="py-3 pr-4">Destaque</th>
              <th className="py-3 pr-4">Desconto</th>
              <th className="py-3 pr-4">Termina em</th>
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
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  Nenhuma promoção cadastrada. Sem promoções ativas, essa seção some da home automaticamente.
                </td>
              </tr>
            ) : (
              promotions.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="flex items-center gap-3 py-3 pl-5 pr-4">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <p className="font-medium text-brand-ink">{p.title}</p>
                  </td>
                  <td className="py-3 pr-4 text-neutral-600">{p.highlight}</td>
                  <td className="py-3 pr-4">
                    {p.discountValue > 0 ? (
                      <span className="inline-flex flex-col">
                        <span className="font-medium text-brand-ink">
                          {p.discountType === "percent"
                            ? `-${p.discountValue}%`
                            : `-${formatBRL(p.discountValue)}`}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {p.discountScope === "all"
                            ? "Toda a loja"
                            : p.discountScope === "category"
                              ? (p.category?.name ?? "Categoria")
                              : `${p.productIds.length} produto(s)`}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">Só banner</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-neutral-500">
                    {p.endsAt ? new Date(p.endsAt).toLocaleString("pt-BR") : "Sem prazo"}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        p.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {p.active ? "Ativa" : "Oculta"}
                    </span>
                  </td>
                  <td className="py-3 pr-5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleActive(p.id, p.active)}
                        title={p.active ? "Ocultar" : "Reativar"}
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                      >
                        {p.active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <Link
                        to={`/admin/promocoes/${p.id}`}
                        title="Editar"
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.title)}
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
        ) : promotions.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400 shadow-sm ring-1 ring-black/5">
            Nenhuma promoção cadastrada. Sem promoções ativas, essa seção some da home automaticamente.
          </div>
        ) : (
          promotions.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-brand-ink">{p.title}</p>
                  <p className="text-xs text-neutral-500">{p.highlight}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    p.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {p.active ? "Ativa" : "Oculta"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  {p.endsAt ? `Termina em ${new Date(p.endsAt).toLocaleString("pt-BR")}` : "Sem prazo"}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleActive(p.id, p.active)}
                    title={p.active ? "Ocultar" : "Reativar"}
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                  >
                    {p.active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <Link
                    to={`/admin/promocoes/${p.id}`}
                    title="Editar"
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id, p.title)}
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
