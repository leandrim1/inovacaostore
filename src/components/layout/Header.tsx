import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, Search, User, ShoppingBag, Mail, Phone, MessageCircle, PackageSearch, LogOut } from "lucide-react";
import { Logo } from "../ui/Logo";
import { InstagramIcon } from "../ui/InstagramIcon";
import { useCategories } from "../../hooks/useCategories";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { STORE, buildWhatsAppLink, formatWhatsAppDisplay } from "../../data/store";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();

  async function handleLogout() {
    setIsAccountMenuOpen(false);
    await logout();
    navigate("/");
  }

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Barra de utilidade: contato + redes — não fixa, some ao rolar a página */}
      <div className="hidden items-center justify-between bg-brand-ink px-6 py-2 text-[11px] tracking-wide text-white/70 lg:flex lg:px-10">
        <div className="flex items-center gap-6">
          <a
            href={`tel:+${settings.whatsappNumber}`}
            className="flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <Phone size={12} />
            {formatWhatsAppDisplay(settings.whatsappNumber)}
          </a>
          <a
            href={`mailto:${settings.contactEmail}`}
            className="flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <Mail size={12} />
            {settings.contactEmail}
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={STORE.social.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="transition-colors hover:text-white"
          >
            <InstagramIcon size={13} />
          </a>
          <a
            href={buildWhatsAppLink(settings.whatsappNumber, "Olá! Vim pelo site e quero falar com a loja.")}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="transition-colors hover:text-white"
          >
            <MessageCircle size={13} />
          </a>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md transition-shadow duration-300 ${
          isScrolled ? "border-brand-ink/10 shadow-[0_1px_0_rgba(0,0,0,0.04),0_12px_24px_-20px_rgba(0,0,0,0.35)]" : "border-transparent"
        }`}
      >
        <div className="container-page relative flex h-16 items-center justify-between gap-4 sm:h-20">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu"
            className="rounded-full p-2 hover:bg-neutral-100 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:translate-x-0 lg:translate-y-0">
            <Logo size={40} />
          </div>

          <nav className="no-scrollbar hidden min-w-0 flex-1 items-center justify-center gap-3 overflow-x-auto lg:flex xl:gap-9">
            {categories.map((cat) => (
              <NavLink
                key={cat.slug}
                to={`/categoria/${cat.slug}`}
                className={({ isActive }) =>
                  `relative shrink-0 whitespace-nowrap py-2 font-display text-sm tracking-widest transition-colors duration-300 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-brand-yellow-dark after:transition-all after:duration-300 ${
                    isActive
                      ? "text-brand-ink after:w-full"
                      : "text-brand-ink/60 after:w-0 hover:text-brand-ink hover:after:w-full"
                  }`
                }
              >
                {cat.name}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buscar"
              className="rounded-full p-2.5 hover:bg-neutral-100"
            >
              <Search size={20} />
            </button>

            {isAuthenticated && user ? (
              <div className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((v) => !v)}
                  aria-label="Conta do cliente"
                  aria-expanded={isAccountMenuOpen}
                  className="flex items-center justify-center rounded-full p-1.5 hover:bg-neutral-100"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-yellow text-xs font-bold text-brand-ink">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </button>

                {isAccountMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAccountMenuOpen(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/5">
                      <Link
                        to="/minha-conta"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-neutral-50"
                      >
                        <User size={16} /> Minha conta
                      </Link>
                      <Link
                        to="/meus-pedidos"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-neutral-50"
                      >
                        <PackageSearch size={16} /> Meus pedidos
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} /> Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                aria-label="Entrar ou criar conta"
                title="Entrar ou criar conta"
                className="hidden rounded-full p-2.5 hover:bg-neutral-100 lg:block"
              >
                <User size={20} />
              </Link>
            )}

            <span className="mx-1 hidden h-6 w-px bg-brand-ink/10 lg:block" aria-hidden />
            <button
              type="button"
              onClick={openCart}
              aria-label="Abrir carrinho"
              className="relative rounded-full p-2.5 hover:bg-neutral-100"
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] font-bold text-brand-ink">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
