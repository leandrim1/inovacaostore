import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { useMyOrders } from "../hooks/useMyOrders";
import { formatBRL } from "../lib/format";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  separacao: "Em separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  boleto: "Boleto",
};

export default function MyOrdersPage() {
  const { data: orders = [], isLoading } = useMyOrders();

  return (
    <>
      <Seo title="Meus pedidos" description="Acompanhe seus pedidos na Inovação Store." />
      <div className="container-page py-10 sm:py-14">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="h-px w-8 bg-brand-ink/20" aria-hidden />
          <span className="font-display text-xs tracking-[0.35em] text-brand-yellow-dark">Área do cliente</span>
        </div>
        <h1 className="section-title mb-8">Meus pedidos</h1>

        {isLoading ? (
          <p className="text-neutral-400">Carregando…</p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-brand-ink/10 bg-neutral-50 py-24 text-center text-neutral-500">
            <PackageSearch size={44} strokeWidth={1.25} />
            <p>Você ainda não fez nenhum pedido.</p>
            <Link to="/categoria/camisetas" className="btn-primary">
              Ver produtos
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-5">
            {orders.map((order) => (
              <li key={order.id} className="rounded-2xl border border-brand-ink/10 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3">
                  <div>
                    <p className="font-display text-base tracking-wide">Pedido #{order.orderNumber}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-ink">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>

                <ul className="flex flex-col divide-y divide-black/5">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-3 text-sm">
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

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-neutral-400">
                    {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                  </span>
                  <span className="font-display text-lg">{formatBRL(order.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
