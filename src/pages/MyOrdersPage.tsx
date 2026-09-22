import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { OrderThumb } from "../components/account/OrderThumb";
import { useMyOrders } from "../hooks/useMyOrders";
import { formatBRL } from "../lib/format";
import { STATUS_LABELS, STATUS_STYLES } from "../lib/orderStatus";
import { paymentMethodLabel } from "../lib/paymentMethods";

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
            <Link to="/busca" className="btn-primary">
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
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      STATUS_STYLES[order.status] ?? "bg-brand-cream text-brand-ink"
                    }`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>

                <ul className="flex flex-col divide-y divide-black/5">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                      <OrderThumb item={item} />
                      <div className="min-w-0 flex-1">
                        {item.productSlug ? (
                          <Link
                            to={`/produto/${item.productSlug}`}
                            className="font-medium text-brand-ink underline-offset-4 hover:underline"
                          >
                            {item.productName}
                          </Link>
                        ) : (
                          <p className="font-medium text-brand-ink">{item.productName}</p>
                        )}
                        <p className="text-xs text-neutral-500">
                          {item.color} · {item.size} · {item.quantity}x
                        </p>
                        {item.promotionTitle && (
                          <p className="mt-0.5 text-xs font-medium text-green-700">{item.promotionTitle}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-right">
                        {item.originalPrice != null && item.originalPrice > item.price && (
                          <span className="block text-xs text-neutral-400 line-through">
                            {formatBRL(item.originalPrice * item.quantity)}
                          </span>
                        )}
                        <span className="font-medium">{formatBRL(item.price * item.quantity)}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-neutral-400">
                    {paymentMethodLabel(order.paymentMethod)}
                    {(order.promotionDiscount ?? 0) > 0 && (
                      <span className="ml-2 normal-case tracking-normal text-green-700">
                        Você economizou {formatBRL(order.promotionDiscount ?? 0)}
                      </span>
                    )}
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
