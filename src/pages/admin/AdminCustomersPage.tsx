import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Search, ShieldAlert } from "lucide-react";
import { useAdminCustomers } from "../../hooks/admin/useAdminCustomers";
import { formatBRL, formatPhoneBR } from "../../lib/format";

/** "—" quando nunca comprou: melhor que uma data inventada ou um zero confuso. */
function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  // Debounce: sem isso cada tecla vira uma requisição (e o limitador do
  // /api/admin corta o admin no meio da própria busca).
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data: customers = [], isLoading } = useAdminCustomers(query || undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-wide">Clientes</h1>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone"
            aria-label="Buscar clientes"
            className="admin-input w-full py-2 pl-9 pr-3"
          />
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5 sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
              <th className="py-3 pl-5 pr-4">Cliente</th>
              <th className="py-3 pr-4">Telefone</th>
              <th className="py-3 pr-4">Pedidos</th>
              <th className="py-3 pr-4">Total gasto</th>
              <th className="py-3 pr-4">Último pedido</th>
              <th className="py-3 pr-5">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  Carregando…
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  {query ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente cadastrado ainda."}
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-black/5 last:border-0">
                  <td className="py-3 pl-5 pr-4">
                    <Link
                      to={`/admin/clientes/${c.id}`}
                      className={`font-medium hover:underline ${
                        c.anonymizedAt ? "text-neutral-400 italic" : "text-brand-ink"
                      }`}
                    >
                      {c.name}
                    </Link>
                    {/* Conta excluída não mostra e-mail nem selo de verificação:
                        não há mais e-mail, e o que está gravado é um endereço
                        de descarte. Mostrar confundiria o lojista. */}
                    {c.anonymizedAt ? (
                      <p className="text-xs text-neutral-400">
                        Conta excluída pelo cliente em{" "}
                        {new Date(c.anonymizedAt).toLocaleDateString("pt-BR")}
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-xs text-neutral-400">
                        {c.email}
                        {c.emailVerified ? (
                          <BadgeCheck size={13} className="text-green-600" aria-label="E-mail verificado" />
                        ) : (
                          <ShieldAlert size={13} className="text-amber-500" aria-label="E-mail não verificado" />
                        )}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-neutral-500">{c.phone ? formatPhoneBR(c.phone) : "—"}</td>
                  <td className="py-3 pr-4">{c.ordersCount}</td>
                  <td className="py-3 pr-4 font-medium">{formatBRL(c.totalSpent)}</td>
                  <td className="py-3 pr-4 text-neutral-500">{formatDate(c.lastOrderAt)}</td>
                  <td className="py-3 pr-5 text-neutral-500">
                    {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                    {!c.hasAccount && <span className="ml-1.5 text-xs text-neutral-400">(convidado)</span>}
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
        ) : customers.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400 shadow-sm ring-1 ring-black/5">
            {query ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente cadastrado ainda."}
          </div>
        ) : (
          customers.map((c) => (
            <Link
              key={c.id}
              to={`/admin/clientes/${c.id}`}
              className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-brand-ink">{c.name}</p>
                  <p className="truncate text-xs text-neutral-400">
                    {c.anonymizedAt
                      ? `Conta excluída em ${new Date(c.anonymizedAt).toLocaleDateString("pt-BR")}`
                      : c.email}
                  </p>
                </div>
                {c.emailVerified ? (
                  <BadgeCheck size={16} className="shrink-0 text-green-600" aria-label="E-mail verificado" />
                ) : (
                  <ShieldAlert size={16} className="shrink-0 text-amber-500" aria-label="E-mail não verificado" />
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">
                  {c.ordersCount} pedido{c.ordersCount === 1 ? "" : "s"}
                </span>
                <span className="text-neutral-500">{formatDate(c.lastOrderAt)}</span>
                <span className="font-medium text-brand-ink">{formatBRL(c.totalSpent)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
