import { useState } from "react";
import { Pencil, Plus, Trash2, X, Check } from "lucide-react";
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
  type AdminCategory,
} from "../../hooks/admin/useAdminCategories";

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; description: string }>({
    name: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      await createCategory.mutateAsync({ name: newName.trim(), description: newDescription.trim() });
      setNewName("");
      setNewDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a categoria.");
    }
  }

  function startEdit(cat: AdminCategory) {
    setEditingId(cat.id);
    setEditDraft({ name: cat.name, description: cat.description });
  }

  async function saveEdit(id: string) {
    setError(null);
    try {
      await updateCategory.mutateAsync({ id, data: editDraft });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  async function handleDelete(cat: AdminCategory) {
    if (!confirm(`Excluir a categoria "${cat.name}"?`)) return;
    setError(null);
    try {
      await deleteCategory.mutateAsync(cat.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl tracking-wide">Categorias</h1>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-neutral-500">Nome</label>
          <input
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: Moletons"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-neutral-500">Descrição</label>
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Descrição curta"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
          />
        </div>
        <button type="submit" className="btn-primary shrink-0">
          <Plus size={16} /> Adicionar
        </button>
      </form>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5 sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
              <th className="py-3 pl-5 pr-4">Nome</th>
              <th className="py-3 pr-4">Slug</th>
              <th className="py-3 pr-4">Descrição</th>
              <th className="py-3 pr-4">Produtos</th>
              <th className="py-3 pr-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-400">
                  Carregando…
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-b border-black/5 last:border-0">
                  {editingId === cat.id ? (
                    <>
                      <td className="py-2.5 pl-5 pr-4">
                        <input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                          className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
                        />
                      </td>
                      <td className="py-2.5 pr-4 text-neutral-400">{cat.slug}</td>
                      <td className="py-2.5 pr-4">
                        <input
                          value={editDraft.description}
                          onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                          className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
                        />
                      </td>
                      <td className="py-2.5 pr-4">{cat.productCount}</td>
                      <td className="py-2.5 pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => saveEdit(cat.id)}
                            className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 pl-5 pr-4 font-medium text-brand-ink">{cat.name}</td>
                      <td className="py-2.5 pr-4 text-neutral-400">{cat.slug}</td>
                      <td className="py-2.5 pr-4 text-neutral-600">{cat.description}</td>
                      <td className="py-2.5 pr-4">{cat.productCount}</td>
                      <td className="py-2.5 pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
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
        {isLoading ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400 shadow-sm ring-1 ring-black/5">
            Carregando…
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              {editingId === cat.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={editDraft.name}
                    onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                    placeholder="Nome"
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                  />
                  <input
                    value={editDraft.description}
                    onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                    placeholder="Descrição"
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => saveEdit(cat.id)}
                      className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-brand-ink">{cat.name}</p>
                      <p className="text-xs text-neutral-400">{cat.slug}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {cat.description && <p className="text-sm text-neutral-600">{cat.description}</p>}
                  <p className="text-xs text-neutral-500">{cat.productCount} produto(s)</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
