import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff, Search } from "lucide-react";
import { useAdminProducts, useDeleteProduct, useUpdateProduct } from "../../hooks/admin/useAdminProducts";
import { formatBRL } from "../../lib/format";

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string>("");
  const { data: products = [], isLoading } = useAdminProducts({ q: q || undefined, active: active || undefined });
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(id: string, current: boolean) {
    await updateProduct.mutateAsync({ id, data: { active: !current } });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    setError(null);
    try {
      await deleteProduct.mutateAsync(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-wide">Produtos</h1>
        <Link to="/admin/produtos/novo" className="btn-primary">
          <Plus size={16} /> Novo produto
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou SKU"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-black/10 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-ink"
          />
        </div>
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
        >
          <option value="">Todos os status</option>
          <option value="true">Ativos</option>
          <option value="false">Ocultos</option>
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
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
                  <td className="py-3 pr-4">{formatBRL(p.price)}</td>
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
    </div>
  );
}
