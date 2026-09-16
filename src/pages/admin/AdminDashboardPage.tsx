import { Link } from "react-router-dom";
import { Package, ShoppingCart, Tags, AlertTriangle } from "lucide-react";
import { useAdminDashboard } from "../../hooks/admin/useAdminDashboard";
import { formatBRL } from "../../lib/format";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  separacao: "Separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading || !data) {
    return <p className="text-neutral-400">Carregando…</p>;
  }

  const cards = [
    {
      label: "Produtos ativos",
      value: `${data.activeProductCount} / ${data.productCount}`,
      icon: Package,
    },
    {
      label: "Pedidos",
      value: `${data.pendingOrderCount} pendente(s) / ${data.orderCount} total`,
      icon: ShoppingCart,
    },
    { label: "Categorias", value: data.categoryCount, icon: Tags },
    { label: "Variações com estoque baixo", value: data.lowStockVariants, icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl tracking-wide">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-cream text-brand-ink">
              <c.icon size={20} />
            </div>
            <div>
              <p className="text-lg font-semibold text-brand-ink">{c.value}</p>
              <p className="text-xs text-neutral-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-wide">Pedidos recentes</h2>
          <Link to="/admin/pedidos" className="text-sm font-medium text-brand-ink hover:underline">
            Ver todos
          </Link>
        </div>

        {data.recentOrders.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">Nenhum pedido ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
                  <th className="py-2 pr-4">Pedido</th>
                  <th className="py-2 pr-4">Cliente</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-black/5 last:border-0">
                    <td className="py-2.5 pr-4">
                      <Link to={`/admin/pedidos/${o.id}`} className="font-medium text-brand-ink hover:underline">
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">{o.customer.name}</td>
                    <td className="py-2.5 pr-4">{formatBRL(o.total)}</td>
                    <td className="py-2.5 pr-4">{STATUS_LABELS[o.status] ?? o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
