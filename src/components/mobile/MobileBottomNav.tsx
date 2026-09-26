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
 * Encaixada na borda de baixo, como a barra de abas de um aplicativo: preta,
 * chapada, com uma régua fina em cima. O item ativo fica branco e ganha um
 * traço amarelo no topo, que desliza de um item a outro — é a única cor da
 * barra. O conteúdo da página ganha o mesmo respiro embaixo
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-ink pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
      >
        <ul className="flex h-14 items-stretch">
          {itens.map((item) => {
            const Icone = item.icone;
            const conteudo = (
              <>
                {item.ativo && (
                  <motion.span
                    layoutId="indicador-barra-inferior"
                    className="absolute inset-x-[30%] top-0 h-0.5 bg-brand-yellow"
                    transition={{ type: "spring", stiffness: 520, damping: 42 }}
                  />
                )}
                <span
                  ref={item.id === "carrinho" ? carrinhoRef : undefined}
                  className={`relative block transition-transform duration-150 group-active:scale-90 ${
                    item.ativo ? "text-white" : "text-white/55"
                  }`}
                >
                  <Icone size={21} strokeWidth={item.ativo ? 2 : 1.6} aria-hidden />
                  {!!item.selo && item.selo > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center overflow-hidden rounded-full bg-brand-yellow px-1 text-[10px] font-bold leading-none text-brand-ink">
                      <span key={item.selo} className="block animate-rolar-numero motion-reduce:animate-none">
                        {item.selo > 99 ? "99+" : item.selo}
                      </span>
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-medium ${item.ativo ? "text-white" : "text-white/55"}`}>{item.rotulo}</span>
              </>
            );
            const classes =
              "group relative flex h-full w-full flex-col items-center justify-center gap-1 [-webkit-tap-highlight-color:transparent]";
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
