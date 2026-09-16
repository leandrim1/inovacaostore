import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ORDER_STATUSES, useAdminOrder, useUpdateOrderStatus } from "../../hooks/admin/useAdminOrders";
import { formatBRL } from "../../lib/format";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  separacao: "Separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !order) {
    return <p className="text-neutral-400">Carregando…</p>;
  }

  async function handleStatusChange(status: string) {
    setError(null);
    try {
      await updateStatus.mutateAsync({ id: order!.id, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o status.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/admin/pedidos" className="flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-ink">
        <ChevronLeft size={16} /> Voltar para pedidos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-wide">Pedido #{order.orderNumber}</h1>
        <select
          value={order.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm font-medium outline-none focus:border-brand-ink"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">ITENS</h2>
            <ul className="flex flex-col divide-y divide-black/5">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-brand-ink">{item.productName}</p>
                    <p className="text-xs text-neutral-500">
                      {item.color} · {item.size} · {item.quantity}x
                    </p>
                  </div>
                  <span className="font-medium">{formatBRL(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">ENTREGA</h2>
            <p className="text-sm text-neutral-600">
              {order.street}, {order.number}
              {order.complement && ` - ${order.complement}`}
              <br />
              {order.neighborhood} - {order.city}/{order.state}
              <br />
              CEP {order.cep}
            </p>
            {order.shippingLabel && (
              <p className="mt-2 text-sm text-neutral-500">
                {order.shippingLabel} — {formatBRL(order.shippingPrice)}
              </p>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">CLIENTE</h2>
            <p className="text-sm font-medium text-brand-ink">{order.customer.name}</p>
            <p className="text-sm text-neutral-500">{order.customer.email}</p>
            <p className="text-sm text-neutral-500">{order.customer.phone}</p>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">RESUMO</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>{formatBRL(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Desconto {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>-{formatBRL(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Frete</span>
                <span>{formatBRL(order.shippingPrice)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-black/10 pt-2 font-display text-lg">
                <span>Total</span>
                <span>{formatBRL(order.total)}</span>
              </div>
              <p className="mt-1 text-xs uppercase text-neutral-400">Pagamento: {order.paymentMethod}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
