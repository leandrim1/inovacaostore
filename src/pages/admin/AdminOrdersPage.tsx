import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminOrders } from "../../hooks/admin/useAdminOrders";
import { ORDER_STATUSES, STATUS_LABELS, STATUS_STYLES } from "../../lib/orderStatus";
import { formatBRL } from "../../lib/format";

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const { data: orders = [], isLoading } = useAdminOrders(status || undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-wide">Pedidos</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
        >
          <option value="">Todos os status</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5 sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
              <th className="py-3 pl-5 pr-4">Pedido</th>
              <th className="py-3 pr-4">Cliente</th>
              <th className="py-3 pr-4">Data</th>
              <th className="py-3 pr-4">Total</th>
              <th className="py-3 pr-4">Pagamento</th>
              <th className="py-3 pr-5">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  Carregando…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-black/5 last:border-0">
                  <td className="py-3 pl-5 pr-4">
                    <Link to={`/admin/pedidos/${o.id}`} className="font-medium text-brand-ink hover:underline">
                      #{o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <p>{o.customer.name}</p>
                    <p className="text-xs text-neutral-400">{o.customer.email}</p>
                  </td>
                  <td className="py-3 pr-4 text-neutral-500">
                    {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 pr-4">{formatBRL(o.total)}</td>
                  <td className="py-3 pr-4 uppercase text-neutral-500">{o.paymentMethod}</td>
                  <td className="py-3 pr-5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[o.status]}`}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
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
        ) : orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-400 shadow-sm ring-1 ring-black/5">
            Nenhum pedido encontrado.
          </div>
        ) : (
          orders.map((o) => (
            <Link
              key={o.id}
              to={`/admin/pedidos/${o.id}`}
              className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-brand-ink">#{o.orderNumber}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[o.status]}`}>
                  {STATUS_LABELS[o.status] ?? o.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-neutral-700">{o.customer.name}</p>
                <p className="text-xs text-neutral-400">{o.customer.email}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">{new Date(o.createdAt).toLocaleDateString("pt-BR")}</span>
                <span className="uppercase text-neutral-500">{o.paymentMethod}</span>
                <span className="font-medium text-brand-ink">{formatBRL(o.total)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
