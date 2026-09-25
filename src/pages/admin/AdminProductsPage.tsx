import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, Star, Upload } from "lucide-react";
import { useAdminProducts, useDeleteProduct, useUpdateProduct } from "../../hooks/admin/useAdminProducts";
import { formatBRL } from "../../lib/format";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string>("");
  const [featured, setFeatured] = useState<string>("");
  const { data: products = [], isLoading } = useAdminProducts({
    q: q || undefined,
    active: active || undefined,
    featured: featured || undefined,
  });
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [error, setError] = useState<string | null>(null);
  const confirmDialog = useConfirmDialog();

  async function toggleActive(id: string, current: boolean) {
    setError(null);
    try {
      await updateProduct.mutateAsync({ id, data: { active: !current } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o produto.");
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    setError(null);
    try {
      await updateProduct.mutateAsync({ id, data: { featured: !current } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o produto.");
    }
  }

  function handleDelete(id: string, name: string) {
    confirmDialog.ask({
      title: "Excluir produto",
      description: `"${name}" será removido para sempre, junto com suas fotos e variações. Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setError(null);
        try {
          await deleteProduct.mutateAsync(id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Não foi possível excluir.");
        }
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-wide">Produtos</h1>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/produtos/importar" className="btn-outline">
            <Upload size={16} /> Importar produtos
          </Link>
          <Link to="/admin/produtos/novo" className="btn-primary">
            <Plus size={16} /> Novo produto
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou SKU"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full admin-input py-2 pl-9 pr-3"
          />
        </div>
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="admin-input px-3 py-2"
        >
          <option value="">Todos os status</option>
          <option value="true">Ativos</option>
          <option value="false">Ocultos</option>
        </select>
        <select
          value={featured}
          onChange={(e) => setFeatured(e.target.value)}
          className="admin-input px-3 py-2"
        >
          <option value="">Destaque: todos</option>
          <option value="true">Em destaque</option>
          <option value="false">Fora de destaque</option>
        </select>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5 sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
              <th className="py-3 pl-5 pr-4">Produto</th>
              <th className="py-3 pr-4">Categoria</th>
              <th className="py-3 pr-4">Preço</th>
              <th className="py-3 pr-4">Estoque</th>
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
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="flex items-center gap-3 py-3 pl-5 pr-4">
                    <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium text-brand-ink">{p.name}</p>
                      <p className="text-xs text-neutral-400">{p.sku}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-neutral-600">{p.category.name}</td>
                  <td className="py-3 pr-4">
                    {p.promotion && p.promotionalPrice != null ? (
                      <span className="flex flex-col">
                        <span className="text-xs text-neutral-400 line-through">{formatBRL(p.price)}</span>
                        <span className="font-medium text-brand-ink">{formatBRL(p.promotionalPrice)}</span>
                        <span className="text-[11px] text-green-700">
                          {p.promotion.title} · -{p.promotion.percentOff}%
                        </span>
                      </span>
                    ) : (
                      formatBRL(p.price)
                    )}
                  </td>
                  <td className="py-3 pr-4">{p.stock}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        p.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {p.active ? "Ativo" : "Oculto"}
                    </span>
                    {p.featured && (
                      <span className="ml-1.5 rounded-full bg-brand-yellow px-2.5 py-1 text-xs font-medium text-brand-ink">
                        Destaque
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(p.id, p.featured)}
                        title={p.featured ? "Remover destaque" : "Marcar como destaque"}
                        className={`rounded-lg p-2 hover:bg-neutral-100 ${
                          p.featured ? "text-brand-yellow-dark" : "text-neutral-500 hover:text-brand-ink"
                        }`}
                      >
                        <Star size={16} fill={p.featured ? "currentColor" : "none"} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(p.id, p.active)}
                        title={p.active ? "Ocultar" : "Reativar"}
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                      >
                        {p.active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <Link
                        to={`/admin/produtos/${p.id}`}
                        title="Editar"
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
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
        ) : products.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400 shadow-sm ring-1 ring-black/5">
            Nenhum produto encontrado.
          </div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-brand-ink">{p.name}</p>
                  <p className="text-xs text-neutral-400">{p.sku}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    p.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {p.active ? "Ativo" : "Oculto"}
                </span>
                {p.featured && (
                  <span className="rounded-full bg-brand-yellow px-2.5 py-1 text-xs font-medium text-brand-ink">
                    Destaque
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-neutral-600">
                <span>{p.category.name}</span>
                <span className="text-right">
                  {p.promotion && p.promotionalPrice != null ? (
                    <>
                      <span className="mr-1.5 text-xs text-neutral-400 line-through">{formatBRL(p.price)}</span>
                      <span className="font-medium">{formatBRL(p.promotionalPrice)}</span>
                      <span className="block text-[11px] text-green-700">
                        {p.promotion.title} · -{p.promotion.percentOff}%
                      </span>
                    </>
                  ) : (
                    formatBRL(p.price)
                  )}
                </span>
                <span>{p.stock} un.</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 border-t border-black/5 pt-2">
                <button
                  type="button"
                  onClick={() => toggleFeatured(p.id, p.featured)}
                  title={p.featured ? "Remover destaque" : "Marcar como destaque"}
                  className={`rounded-lg p-2 hover:bg-neutral-100 ${
                    p.featured ? "text-brand-yellow-dark" : "text-neutral-500 hover:text-brand-ink"
                  }`}
                >
                  <Star size={16} fill={p.featured ? "currentColor" : "none"} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(p.id, p.active)}
                  title={p.active ? "Ocultar" : "Reativar"}
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                >
                  {p.active ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <Link
                  to={`/admin/produtos/${p.id}`}
                  title="Editar"
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                >
                  <Pencil size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id, p.name)}
                  title="Excluir"
                  className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </div>
  );
}
