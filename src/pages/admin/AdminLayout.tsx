import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Tags, ShoppingCart, LogOut, ExternalLink, Megaphone, Settings } from "lucide-react";
import { Logo } from "../../components/ui/Logo";
import { useAdminAuth } from "../../context/AdminAuthContext";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: Tags },
  { to: "/admin/promocoes", label: "Promoções", icon: Megaphone },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminLayout() {
  const { admin, isLoading, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="flex min-h-dvh items-center justify-center text-neutral-400">Carregando…</div>;
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  async function handleLogout() {
    await logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="flex min-h-dvh bg-neutral-50">
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-ink text-white lg:flex">
        <div className="border-b border-white/10 p-5">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-yellow text-brand-ink" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t border-white/10 p-4">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink size={18} />
            Ver loja
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-black/5 bg-white px-5 py-4 lg:hidden">
          <Logo />
          <button type="button" onClick={handleLogout} className="text-sm font-medium text-neutral-500">
            Sair
          </button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-black/5 bg-white px-3 py-2 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                  isActive ? "bg-brand-ink text-white" : "text-neutral-500"
                }`
              }
            >
              <item.icon size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 px-6 pt-4 text-sm text-neutral-500">
          Olá, <strong className="text-brand-ink">{admin.name}</strong>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
