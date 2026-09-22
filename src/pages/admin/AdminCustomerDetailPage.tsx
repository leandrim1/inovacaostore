import { Link, useParams } from "react-router-dom";
import { BadgeCheck, ChevronLeft, Mail, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { useAdminCustomer } from "../../hooks/admin/useAdminCustomers";
import { STATUS_LABELS, STATUS_STYLES } from "../../lib/orderStatus";
import { paymentMethodLabel } from "../../lib/paymentMethods";
import { formatBRL, formatItemCount, formatPhoneBR } from "../../lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 font-display text-xl tracking-wide text-brand-ink">{value}</p>
    </div>
  );
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useAdminCustomer(id);

  if (isLoading) return <p className="text-neutral-400">Carregando…</p>;
  if (!data) return <p className="text-neutral-400">Cliente não encontrado.</p>;

  const { customer, orders, addresses } = data;
  const phoneDigits = customer.phone.replace(/\D/g, "");
  // O link do WhatsApp precisa do DDI; o cadastro pode ter só DDD + número.
  const whatsappNumber = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;
  const lastOrder = orders[0];

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/admin/clientes"
        className="flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-ink"
      >
        <ChevronLeft size={16} /> Voltar para clientes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-wide">{customer.name}</h1>
          <p className="text-sm text-neutral-500">
            Cliente desde{" "}
            {new Date(customer.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            {!customer.hasAccount && " · comprou como convidado (sem senha cadastrada)"}
          </p>
        </div>
        {phoneDigits.length >= 10 && (
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white"
          >
            <MessageCircle size={16} /> Falar no WhatsApp
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pedidos" value={String(customer.ordersCount)} />
        <Stat label="Vendas efetivas" value={String(customer.paidOrdersCount)} />
        <Stat label="Total gasto" value={formatBRL(customer.totalSpent)} />
        <Stat
          label="Ticket médio"
          value={
            customer.paidOrdersCount > 0
              ? formatBRL(customer.totalSpent / customer.paidOrdersCount)
              : "—"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display text-sm tracking-widest text-neutral-500">CONTATO</h2>
          <p className="flex items-start gap-2 break-all text-sm text-brand-ink">
            <Mail size={16} className="mt-0.5 shrink-0 text-neutral-400" />
            {customer.email}
          </p>
          <p className="flex items-center gap-2 text-sm text-brand-ink">
            <Phone size={16} className="shrink-0 text-neutral-400" />
            {customer.phone ? formatPhoneBR(customer.phone) : "Não informado"}
          </p>
          {customer.emailVerified ? (
            <p className="flex items-center gap-1.5 text-sm text-green-700">
              <BadgeCheck size={16} /> E-mail verificado
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-sm text-amber-600">
              <ShieldAlert size={16} /> E-mail não verificado
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2">
          <h2 className="mb-3 font-display text-sm tracking-widest text-neutral-500">
            ÚLTIMO ENDEREÇO DE ENTREGA
          </h2>
          {lastOrder ? (
            <address className="text-sm not-italic leading-relaxed text-brand-ink">
              {lastOrder.street}, {lastOrder.number}
              {lastOrder.complement && ` — ${lastOrder.complement}`}
              <br />
              {lastOrder.neighborhood} · {lastOrder.city}/{lastOrder.state}
              <br />
              CEP {lastOrder.cep}
            </address>
          ) : (
            <p className="text-sm text-neutral-400">
              Este cliente ainda não fez pedidos, então não há endereço de entrega registrado.
            </p>
          )}

          {/* Endereços que o próprio cliente salvou na conta. É outra coisa
              que o endereço do pedido: este é o caderninho dele, aquele é
              para onde a compra foi de fato. */}
          {addresses.length > 0 && (
            <div className="mt-5 border-t border-black/5 pt-4">
              <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">
                Endereços salvos pelo cliente ({addresses.length})
              </h3>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <li key={a.id} className="text-sm leading-relaxed text-neutral-600">
                    <span className="font-medium text-brand-ink">{a.label || "Endereço"}</span>
                    {a.isDefault && (
                      <span className="ml-1.5 text-[10px] tracking-wide text-brand-yellow-dark">PADRÃO</span>
                    )}
                    <br />
                    {a.street}, {a.number}
                    {a.complement && ` — ${a.complement}`} · {a.neighborhood}
                    <br />
                    {a.city}/{a.state} · CEP {a.cep}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">PEDIDOS DESTE CLIENTE</h2>
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">Nenhum pedido ainda.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/5">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <Link
                    to={`/admin/pedidos/${order.id}`}
                    className="font-medium text-brand-ink hover:underline"
                  >
                    #{order.orderNumber}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")} ·{" "}
                    {formatItemCount(order.items.reduce((sum, i) => sum + i.quantity, 0))} ·{" "}
                    {paymentMethodLabel(order.paymentMethod)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="font-medium text-brand-ink">{formatBRL(order.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
