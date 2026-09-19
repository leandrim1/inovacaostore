import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, Search, User, UserPlus, ShoppingBag, ChevronDown, PackageSearch, LogOut } from "lucide-react";
import { Logo } from "../ui/Logo";
import { useCategories } from "../../hooks/useCategories";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";

const CATEGORIES_PER_PAGE = 5;

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [categoryPage, setCategoryPage] = useState(0);
  const { itemCount, openCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: categories = [] } = useCategories();
  const navigate = useNavigate();
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu da conta ao clicar fora ou apertar Esc. O padrão anterior era
  // um `fixed inset-0` invisível atrás do menu, mas o `backdrop-blur-md` do
  // header faz dele o bloco de contenção dos filhos `fixed` — esse fundo
  // cobria só a faixa do cabeçalho, então clicar na página não fechava nada.
  useEffect(() => {
    if (!isAccountMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!accountMenuRef.current?.contains(e.target as Node)) setIsAccountMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsAccountMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isAccountMenuOpen]);

  const categoryPageCount = Math.ceil(categories.length / CATEGORIES_PER_PAGE);
  const safeCategoryPage = categoryPageCount > 0 ? categoryPage % categoryPageCount : 0;
  const visibleCategories = categories.slice(
    safeCategoryPage * CATEGORIES_PER_PAGE,
    safeCategoryPage * CATEGORIES_PER_PAGE + CATEGORIES_PER_PAGE,
  );

  useEffect(() => {
    if (categoryPageCount <= 1) return;
    const timer = setInterval(() => setCategoryPage((p) => p + 1), 10000);
    return () => clearInterval(timer);
  }, [categoryPageCount]);

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
      <header
        className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md transition-shadow duration-300 ${
          isScrolled ? "border-brand-ink/10 shadow-[0_1px_0_rgba(0,0,0,0.04),0_12px_24px_-20px_rgba(0,0,0,0.35)]" : "border-transparent"
        }`}
      >
        {/* No desktop o header solta a largura máxima do container e vai de
            ponta a ponta (logo colada na esquerda, ações na direita), com o
            menu centralizado — o arranjo de header de loja grande. Abaixo de
            lg nada muda: continua o `container-page` de sempre. */}
        <div className="container-page relative flex h-16 items-center justify-between gap-4 sm:h-20 lg:max-w-none lg:px-10">
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

          {/* Centralizado entre a logo e as ações, em vez de empurrado para a
              direita. Centralizar na página inteira (absolute + left-1/2) dava
              o alinhamento perfeito em telas largas, mas em 1024px o menu
              passava por cima dos ícones — o bloco de ações é bem mais largo
              que a logo, então o centro real da página não é o centro do
              espaço livre. Como irmão flex, ele divide o espaço e nunca
              colide. */}
          <nav className="hidden flex-1 items-center justify-center lg:flex">
            <AnimatePresence mode="wait">
              <motion.div
                key={safeCategoryPage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex items-center gap-8"
              >
                {visibleCategories.map((cat) => (
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
              </motion.div>
            </AnimatePresence>
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
              <div ref={accountMenuRef} className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((v) => !v)}
                  aria-label="Conta do cliente"
                  aria-expanded={isAccountMenuOpen}
                  className="flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-2.5 hover:bg-neutral-100"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-yellow text-xs font-bold text-brand-ink">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[110px] truncate text-sm font-medium">Olá, {user.name.split(" ")[0]}</span>
                  <ChevronDown size={14} />
                </button>

                {isAccountMenuOpen && (
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
                )}
              </div>
            ) : (
              <>
                {/* De 1024 a 1279 os dois botões de texto ocupam espaço demais
                    e empurram as categorias contra os ícones. Nessa faixa eles
                    viram um ícone de pessoa com as mesmas duas opções dentro.
                    De xl pra cima, onde sobra largura, voltam como botões. */}
                <div ref={accountMenuRef} className="relative hidden lg:block xl:hidden">
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen((v) => !v)}
                    aria-label="Entrar ou criar conta"
                    aria-expanded={isAccountMenuOpen}
                    className="rounded-full p-2.5 hover:bg-neutral-100"
                  >
                    <User size={20} />
                  </button>

                  {isAccountMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/5">
                      <Link
                        to="/login"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-neutral-50"
                      >
                        <User size={16} /> Entrar
                      </Link>
                      <Link
                        to="/cadastro"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-ink hover:bg-neutral-50"
                      >
                        <UserPlus size={16} /> Criar conta
                      </Link>
                    </div>
                  )}
                </div>

                <div className="hidden items-center gap-1 xl:flex">
                  <Link
                    to="/login"
                    className="rounded-full px-3.5 py-2 font-display text-xs tracking-widest text-brand-ink/70 transition-colors hover:bg-neutral-100 hover:text-brand-ink"
                  >
                    Entrar
                  </Link>
                  <Link to="/cadastro" className="btn-primary px-4 py-2 text-xs">
                    Criar conta
                  </Link>
                </div>
              </>
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
