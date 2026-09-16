import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, Search, User, ShoppingBag } from "lucide-react";
import { Logo } from "../ui/Logo";
import { CATEGORIES } from "../../data/categories";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const { customer, openAccount } = useAuth();

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
      <header
        className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-shadow ${
          isScrolled ? "border-black/10 shadow-sm" : "border-transparent"
        }`}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-20">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu"
            className="rounded-full p-2 hover:bg-neutral-100 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <Logo />

          <nav className="hidden items-center gap-7 lg:flex">
            {CATEGORIES.map((cat) => (
              <NavLink
                key={cat.slug}
                to={`/categoria/${cat.slug}`}
                className={({ isActive }) =>
                  `font-display text-sm tracking-widest transition-colors hover:text-brand-yellow-dark ${
                    isActive ? "text-brand-yellow-dark" : "text-brand-ink"
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
            <button
              type="button"
              onClick={openAccount}
              aria-label="Conta do cliente"
              className="hidden rounded-full p-2.5 hover:bg-neutral-100 sm:flex"
            >
              {customer ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-yellow text-xs font-bold text-brand-ink">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User size={20} />
              )}
            </button>
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
