import { useRef } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useQuiqueDoCarrinho } from "../../hooks/useQuiqueDoCarrinho";
import { formatBRL } from "../../lib/format";
import { BotaoFavorito } from "../ui/BotaoFavorito";

/**
 * Barra de compra da página de produto no celular — ocupa o lugar da barra
 * de navegação, encaixada na borda de baixo, ao alcance do polegar:
 * favoritar, abrir o carrinho e o CTA principal "Adicionar", sempre visível
 * enquanto a pessoa lê a descrição. Branca e chapada: a única cor é o botão
 * de compra. O ícone do carrinho aqui é o alvo do "voo" da foto ao adicionar.
 */
export function BarraDeCompra({
  produtoId,
  nome,
  preco,
  rotulo,
  detalhe,
  desabilitado,
  onAdicionar,
}: {
  produtoId: string;
  nome: string;
  preco: number;
  rotulo: string;
  detalhe?: string;
  desabilitado: boolean;
  onAdicionar: () => void;
}) {
  const { itemCount, openCart } = useCart();
  const carrinhoRef = useRef<HTMLSpanElement>(null);
  useQuiqueDoCarrinho(carrinhoRef);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink/10 bg-white px-3 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] pt-1 lg:hidden">
      <div className="flex h-12 items-center gap-2">
        <BotaoFavorito produtoId={produtoId} nome={nome} tom="solido" className="-mx-0.5" />
        <button
          type="button"
          onClick={openCart}
          aria-label="Abrir carrinho"
          data-alvo-carrinho=""
          className="relative grid h-11 w-11 shrink-0 place-items-center text-brand-ink active:scale-95"
        >
          <span ref={carrinhoRef} className="block">
            <ShoppingBag size={21} strokeWidth={1.8} />
          </span>
          {itemCount > 0 && (
            <span className="absolute right-0.5 top-1 grid h-4 min-w-4 place-items-center overflow-hidden rounded-full bg-brand-yellow px-1 text-[10px] font-bold leading-none text-brand-ink">
              <span key={itemCount} className="block animate-rolar-numero motion-reduce:animate-none">
                {itemCount}
              </span>
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onAdicionar}
          disabled={desabilitado}
          className="btn-accent btn-3d-accent h-full min-h-0 flex-1 justify-between !gap-3 !px-4 !py-0 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="text-[15px] tracking-[0.1em]">{rotulo}</span>
          <span className="min-w-0 truncate font-sans text-[13px] font-semibold tracking-normal">
            {formatBRL(preco)}
            {detalhe ? <span className="font-normal text-brand-ink/70"> · {detalhe}</span> : null}
          </span>
        </button>
      </div>
    </div>
  );
}
