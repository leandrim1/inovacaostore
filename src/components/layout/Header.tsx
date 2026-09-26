import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, User, UserPlus, ShoppingBag, ChevronDown, PackageSearch, LogOut } from "lucide-react";
import { Logo } from "../ui/Logo";
import { useCategories } from "../../hooks/useCategories";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";
import { UserAvatar } from "../account/UserAvatar";
import { EVENTO_HERO } from "../../lib/experiencia3d";
import { abrirPainel, fecharPainel, usePainel } from "../../lib/paineis";
import { useQuiqueDoCarrinho } from "../../hooks/useQuiqueDoCarrinho";

const CATEGORIES_PER_PAGE = 5;

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [sobreHero, setSobreHero] = useState(false);
  const { pathname } = useLocation();
  const painel = usePainel();
  const carrinhoRef = useRef<HTMLSpanElement>(null);
  useQuiqueDoCarrinho(carrinhoRef);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [categoryPage, setCategoryPage] = useState(0);
  const { itemCount, openCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: categories = [] } = useCategories();
  const navigate = useNavigate();
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu da conta ao clicar fora ou apertar Esc — ouvindo o documento
  // em vez de pôr um `fixed inset-0` invisível atrás do menu: qualquer filtro
  // no header (como o desfoque que ele já teve) faz dele o bloco de contenção
  // dos filhos `fixed`, e esse fundo passaria a cobrir só a faixa do topo.
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

  // Sobre o hero e as seções escuras (a faixa de benefícios, a newsletter),
  // o header troca para o tom escuro com texto claro. As seções escuras se
  // marcam com `data-cabecalho-escuro`.
  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 12);
      const linha = 72;
      let escura = false;
      document.querySelectorAll("[data-cabecalho-escuro]").forEach((el) => {
        const caixa = el.getBoundingClientRect();
        if (caixa.top < linha && caixa.bottom > linha) escura = true;
      });
      setSobreHero(escura);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener(EVENTO_HERO, onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener(EVENTO_HERO, onScroll);
    };
  }, [pathname]);

  const escuro = sobreHero;
  const hoverFundo = escuro ? "hover:bg-white/10" : "hover:bg-neutral-100";

  return (
    <>
      {/* Chapado, sem vidro: no topo do hero ele é transparente sobre a foto;
          rolando por cima de uma seção escura vira preto; no resto, creme com
          uma régua fina embaixo. */}
      <header
        className={`sticky top-0 z-50 border-b transition-[background-color,border-color,color] duration-300 ${
          escuro
            ? isScrolled
              ? "border-white/10 bg-brand-ink text-white"
              : "border-white/10 bg-transparent text-white"
            : isScrolled
              ? "border-brand-ink/10 bg-brand-cream text-brand-ink"
              : "border-transparent bg-brand-cream text-brand-ink"
        }`}
      >
        {/* No desktop o header solta a largura máxima do container e vai de
            ponta a ponta (logo colada na esquerda, ações na direita), com o
            menu centralizado — o arranjo de header de loja grande. Abaixo de
            lg nada muda: continua o `container-page` de sempre. */}
        <div className="container-page relative flex h-16 items-center justify-between gap-4 sm:h-20 lg:max-w-none lg:px-10">
          <button
            type="button"
            onClick={() => abrirPainel("menu")}
            aria-label="Abrir menu"
            className={`grid h-11 w-11 place-items-center rounded-full transition-colors lg:hidden ${hoverFundo}`}
          >
            <Menu size={22} />
          </button>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:translate-x-0 lg:translate-y-0">
            <Logo size={40} tone={escuro ? "dark" : "light"} />
          </div>

          {/* Centralizado no meio da PÁGINA, não no vão entre a logo e as
              ações: por ser absoluto, ele ignora a largura desigual dos dois
              lados e cai no centro exato. Isso antes esbarrava nos ícones em
              1024px, quando Entrar/Criar conta ainda eram dois botões largos;
              desde que viraram um ícone nessa faixa, sobra folga (ver teste de
              colisão). Se um dia voltarem a crescer ali, o menu volta a
              encostar — é o custo de centralizar na página. */}
          <nav className="hidden items-center lg:absolute lg:left-1/2 lg:flex lg:-translate-x-1/2">
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
                      `relative shrink-0 whitespace-nowrap py-2 font-display text-sm tracking-widest transition-colors duration-300 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:transition-all after:duration-300 ${
                        escuro ? "after:bg-brand-yellow" : "after:bg-brand-yellow-dark"
                      } ${
                        isActive
                          ? `${escuro ? "text-white" : "text-brand-ink"} after:w-full`
                          : escuro
                            ? "text-white/70 after:w-0 hover:text-white hover:after:w-full"
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
            {/* No celular busca e carrinho moram na barra inferior (alcance do
                polegar); aqui em cima fica só a conta. */}
            <Link
              to={isAuthenticated ? "/minha-conta" : "/login"}
              aria-label={isAuthenticated ? "Minha conta" : "Entrar na conta"}
              className={`grid h-11 w-11 place-items-center rounded-full transition-colors lg:hidden ${hoverFundo}`}
            >
              {isAuthenticated && user ? (
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.avatarUrl}
                  letras={1}
                  className="h-8 w-8 bg-brand-yellow text-xs font-bold text-brand-ink"
                />
              ) : (
                <User size={21} />
              )}
            </Link>
            <button
              type="button"
              onClick={() => abrirPainel("busca")}
              aria-label="Buscar"
              className={`hidden rounded-full p-2.5 transition-colors lg:block ${hoverFundo}`}
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
                  className={`flex items-center gap-1.5 rounded-full p-1.5 transition-colors xl:py-1.5 xl:pl-1.5 xl:pr-2.5 ${hoverFundo}`}
                >
                  <UserAvatar
                    name={user.name}
                    avatarUrl={user.avatarUrl}
                    letras={1}
                    className="h-7 w-7 bg-brand-yellow text-xs font-bold text-brand-ink"
                  />
                  {/* Entre 1024 e 1279 fica só o avatar, pela mesma razão do
                      ícone de visitante: com o nome, o bloco da direita chega a
                      293px e o menu centralizado bate nele. */}
                  <span className="hidden max-w-[110px] truncate text-sm font-medium xl:inline">
                    Olá, {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown size={14} className="hidden xl:block" />
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl bg-white p-1.5 text-brand-ink shadow-lg ring-1 ring-black/5">
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
                    className={`rounded-full p-2.5 transition-colors ${hoverFundo}`}
                  >
                    <User size={20} />
                  </button>

                  {isAccountMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl bg-white p-1.5 text-brand-ink shadow-lg ring-1 ring-black/5">
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
                    className={`rounded-full px-3.5 py-2 font-display text-xs tracking-widest transition-colors ${
                      escuro
                        ? "text-white/80 hover:bg-white/10 hover:text-white"
                        : "text-brand-ink/70 hover:bg-neutral-100 hover:text-brand-ink"
                    }`}
                  >
                    Entrar
                  </Link>
                  <Link to="/cadastro" className={`${escuro ? "btn-accent" : "btn-primary"} px-4 py-2 text-xs`}>
                    Criar conta
                  </Link>
                </div>
              </>
            )}
            <span className={`mx-1 hidden h-6 w-px lg:block ${escuro ? "bg-white/15" : "bg-brand-ink/10"}`} aria-hidden />
            <button
              type="button"
              onClick={openCart}
              aria-label="Abrir carrinho"
              data-alvo-carrinho=""
              className={`relative hidden rounded-full p-2.5 transition-colors lg:block ${hoverFundo}`}
            >
              <span ref={carrinhoRef} className="block">
                <ShoppingBag size={20} />
              </span>
              {itemCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] font-bold text-brand-ink">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={painel === "menu"} onClose={fecharPainel} />
      <SearchOverlay isOpen={painel === "busca"} onClose={fecharPainel} />
    </>
  );
}
