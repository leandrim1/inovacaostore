import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PackageSearch, Search } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { OrderThumb } from "../components/account/OrderThumb";
import { AccountBreadcrumb } from "../components/account/AccountBreadcrumb";
import { useMyOrders, type MyOrder } from "../hooks/useMyOrders";
import { formatBRL } from "../lib/format";
import { STATUS_LABELS, STATUS_STYLES } from "../lib/orderStatus";
import { paymentMethodLabel } from "../lib/paymentMethods";

/**
 * Períodos do filtro, em dias. `0` = todo o histórico, e é o padrão.
 *
 * Lojas grandes abrem em "últimos 3 meses" porque a lista de um cliente
 * delas tem dezenas de pedidos. Aqui, começar filtrado esconderia a única
 * compra de quem comprou uma vez no ano — a pessoa abriria "Meus pedidos" e
 * leria "nenhum pedido encontrado". O filtro existe para quem precisa; o
 * padrão mostra tudo.
 *
 * O filtro roda no cliente porque a rota já devolve os pedidos do cliente
 * logado inteiros — e são poucos. Paginar no servidor só vale a pena quando
 * alguém tiver histórico grande o bastante para a lista pesar.
 */
const PERIODOS = [
  { valor: 0, rotulo: "Todo o período" },
  { valor: 30, rotulo: "Últimos 30 dias" },
  { valor: 90, rotulo: "Últimos 3 meses" },
  { valor: 180, rotulo: "Últimos 6 meses" },
  { valor: 365, rotulo: "Últimos 12 meses" },
] as const;

function dentroDoPeriodo(order: MyOrder, dias: number) {
  if (dias === 0) return true;
  const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
  return new Date(order.createdAt).getTime() >= limite;
}

export default function MyOrdersPage() {
  const { data: orders = [], isLoading } = useMyOrders();
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState<number>(0);
  const [status, setStatus] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return orders.filter((order) => {
      if (!dentroDoPeriodo(order, periodo)) return false;
      if (status && order.status !== status) return false;
      if (!termo) return true;
      // Busca pelo nome do produto ou pelo número do pedido: são as duas
      // coisas que o cliente tem na mão quando vem procurar uma compra.
      return (
        order.orderNumber.toLowerCase().includes(termo) ||
        order.items.some((item) => item.productName.toLowerCase().includes(termo))
      );
    });
  }, [orders, busca, periodo, status]);

  /** Só os status que este cliente realmente tem — nada de filtrar para o vazio. */
  const statusDisponiveis = useMemo(
    () => Array.from(new Set(orders.map((o) => o.status))),
    [orders],
  );

  const temFiltro = busca.trim() !== "" || status !== "" || periodo !== 0;

  return (
    <>
      <Seo title="Meus pedidos" description="Acompanhe seus pedidos na Inovação Store." />
      <div className="container-page py-10 sm:py-14">
        <AccountBreadcrumb current="Meus pedidos" />
        <h1 className="section-title mb-8">Meus pedidos</h1>

        {orders.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por produto ou número do pedido"
                aria-label="Buscar nos seus pedidos"
                className="input-field pl-9"
              />
            </div>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(Number(e.target.value))}
              aria-label="Período"
              className="input-field sm:w-52"
            >
              {PERIODOS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.rotulo}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Status do pedido"
              className="input-field sm:w-48"
            >
              <option value="">Todos os status</option>
              {statusDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </select>
          </div>
        )}

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
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-ink/10 bg-neutral-50 py-16 text-center text-neutral-500">
            <PackageSearch size={36} strokeWidth={1.25} />
            <p className="text-sm">Nenhum pedido encontrado com esses filtros.</p>
            {temFiltro && (
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setStatus("");
                  setPeriodo(0);
                }}
                className="text-sm font-medium text-brand-ink underline underline-offset-4"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-5">
            {filtrados.map((order) => (
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
