import { useRef, type ComponentType } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Heart, Home, LayoutGrid, Search, ShoppingBag, type LucideProps } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useFavoritos } from "../../lib/favoritos";
import { abrirPainel, barraInferiorVisivel, fecharPainel, usePainel } from "../../lib/paineis";
import { useQuiqueDoCarrinho } from "../../hooks/useQuiqueDoCarrinho";
import { CategoriasSheet } from "./CategoriasSheet";

/**
 * Barra de navegação inferior do celular — o polegar alcança tudo sem
 * esticar: Início, Categorias, Buscar, Favoritos e Carrinho.
 *
 * Vidro escuro flutuando acima da área segura do iPhone. O item ativo
 * acende (ícone amarelo com brilho) e ganha um filete luminoso que desliza
 * de um item a outro. O conteúdo da página ganha um respiro embaixo
 * (`--barra-inferior`), então a barra nunca cobre nada.
 *
 * Fica fora do checkout (foco total em finalizar) e da página de produto,
 * onde a barra de compra ocupa o mesmo lugar.
 */
interface Item {
  id: string;
  rotulo: string;
  icone: ComponentType<LucideProps>;
  ativo: boolean;
  to?: string;
  onClick?: () => void;
  selo?: number;
  ariaLabel?: string;
}

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { itemCount, openCart, isOpen } = useCart();
  const { quantidade } = useFavoritos();
  const painel = usePainel();
  const carrinhoRef = useRef<HTMLSpanElement>(null);
  useQuiqueDoCarrinho(carrinhoRef);

  if (!barraInferiorVisivel(pathname)) return null;

  const itens: Item[] = [
    { id: "inicio", rotulo: "Início", icone: Home, to: "/", ativo: pathname === "/" && !painel && !isOpen },
    {
      id: "categorias",
      rotulo: "Categorias",
      icone: LayoutGrid,
      onClick: () => (painel === "categorias" ? fecharPainel() : abrirPainel("categorias")),
      ativo: painel === "categorias" || (pathname.startsWith("/categoria/") && !painel && !isOpen),
    },
    {
      id: "buscar",
      rotulo: "Buscar",
      icone: Search,
      onClick: () => abrirPainel("busca"),
      ativo: painel === "busca" || (pathname.startsWith("/busca") && !painel && !isOpen),
    },
    {
      id: "favoritos",
      rotulo: "Favoritos",
      icone: Heart,
      to: "/favoritos",
      selo: quantidade,
      ativo: pathname === "/favoritos" && !painel && !isOpen,
    },
    {
      id: "carrinho",
      rotulo: "Carrinho",
      icone: ShoppingBag,
      onClick: () => {
        fecharPainel();
        openCart();
      },
      selo: itemCount,
      ativo: isOpen || (pathname === "/carrinho" && !painel),
      ariaLabel: "Abrir carrinho",
    },
  ];

  return (
    <>
      <nav
        aria-label="Navegação da loja"
        className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom,0px))] z-40 lg:hidden"
      >
        <ul className="vidro-escuro flex h-[4.25rem] items-stretch rounded-[26px] px-1">
          {itens.map((item) => {
            const Icone = item.icone;
            const conteudo = (
              <>
                {item.ativo && (
                  <motion.span
                    layoutId="indicador-barra-inferior"
                    className="absolute top-1 h-[3px] w-7 rounded-full bg-brand-yellow shadow-[0_0_12px_2px_rgba(245,196,0,0.7)]"
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  />
                )}
                <span
                  ref={item.id === "carrinho" ? carrinhoRef : undefined}
                  className={`relative grid h-8 w-10 place-items-center rounded-xl transition-all duration-300 group-active:scale-90 ${
                    item.ativo
                      ? "-translate-y-0.5 bg-white/[0.07] text-brand-yellow shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_14px_-6px_rgba(245,196,0,0.55)]"
                      : "text-white/70"
                  }`}
                >
                  <Icone size={21} strokeWidth={item.ativo ? 2.2 : 1.8} aria-hidden />
                  {!!item.selo && item.selo > 0 && (
                    <span className="absolute -right-1 -top-1.5 grid h-[18px] min-w-[18px] place-items-center overflow-hidden rounded-full bg-brand-yellow px-1 text-[10px] font-bold text-brand-ink ring-2 ring-brand-ink">
                      <span key={item.selo} className="block animate-rolar-numero motion-reduce:animate-none">
                        {item.selo > 99 ? "99+" : item.selo}
                      </span>
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-medium tracking-wide ${item.ativo ? "text-white" : "text-white/60"}`}>
                  {item.rotulo}
                </span>
              </>
            );
            const classes =
              "group relative flex h-full w-full flex-col items-center justify-center gap-0.5 [-webkit-tap-highlight-color:transparent]";
            return (
              <li key={item.id} className="flex min-w-11 flex-1">
                {item.to ? (
                  <Link
                    to={item.to}
                    onClick={fecharPainel}
                    aria-current={item.ativo ? "page" : undefined}
                    className={classes}
                  >
                    {conteudo}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={item.onClick}
                    aria-label={item.ariaLabel}
                    aria-pressed={item.ativo}
                    data-alvo-carrinho={item.id === "carrinho" ? "" : undefined}
                    className={classes}
                  >
                    {conteudo}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <CategoriasSheet aberto={painel === "categorias"} onFechar={fecharPainel} />
    </>
  );
}
