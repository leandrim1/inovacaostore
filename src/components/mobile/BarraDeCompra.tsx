import { useRef } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useQuiqueDoCarrinho } from "../../hooks/useQuiqueDoCarrinho";
import { formatBRL } from "../../lib/format";
import { BotaoFavorito } from "../ui/BotaoFavorito";

/**
 * Barra de compra da página de produto no celular — ocupa o lugar da barra
 * de navegação, ao alcance do polegar: favoritar, abrir o carrinho e o CTA
 * principal "Adicionar", sempre visível enquanto a pessoa lê a descrição.
 * O ícone do carrinho aqui é o alvo do "voo" da foto ao adicionar.
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
    <div className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom,0px))] z-40 lg:hidden">
      <div className="vidro-escuro flex h-[4.25rem] items-center gap-1.5 rounded-[26px] p-1.5 text-white">
        <BotaoFavorito produtoId={produtoId} nome={nome} className="[&>span]:!bg-white/10 [&>span]:!bg-none [&>span]:!shadow-none [&_svg]:!text-white" />
        <button
          type="button"
          onClick={openCart}
          aria-label="Abrir carrinho"
          data-alvo-carrinho=""
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 active:scale-90"
        >
          <span ref={carrinhoRef} className="block">
            <ShoppingBag size={19} />
          </span>
          {itemCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center overflow-hidden rounded-full bg-brand-yellow px-1 text-[10px] font-bold text-brand-ink ring-2 ring-brand-ink">
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
          className="btn-accent btn-3d-accent h-full min-h-0 flex-1 flex-col !gap-0 px-3 py-1 leading-tight disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="text-[13px] tracking-[0.14em]">{rotulo}</span>
          <span className="font-sans text-[11px] font-semibold tracking-normal text-brand-ink/75">
            {formatBRL(preco)}
            {detalhe ? ` · ${detalhe}` : ""}
          </span>
        </button>
      </div>
    </div>
  );
}
