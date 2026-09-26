import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "../../data/types";
import { ProductCard } from "../product/ProductCard";

/**
 * Faixa de produtos do celular e do tablet: rolagem nativa com snap (inércia
 * de aplicativo, sem brigar com a rolagem vertical da página), alinhada à
 * margem da página, com a próxima peça aparecendo na borda — é ela que
 * convida a deslizar. Embaixo, a posição ("03 / 08") e as setas para quem
 * prefere tocar.
 *
 * Tocar numa peça que está quase toda fora da tela primeiro a traz para
 * dentro (em vez de agir sobre um card que mal se vê); as visíveis
 * funcionam como qualquer card.
 */
export function MobileProductCarousel({ produtos }: { produtos: Product[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const itens = useRef<(HTMLDivElement | null)[]>([]);
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    let quadro = 0;
    const atualizar = () => {
      quadro = 0;
      const inicio = el.scrollLeft + parseFloat(getComputedStyle(el).scrollPaddingLeft || "0");
      let melhor = 0;
      let menor = Infinity;
      itens.current.forEach((item, i) => {
        if (!item) return;
        const d = Math.abs(item.offsetLeft - inicio);
        if (d < menor) {
          menor = d;
          melhor = i;
        }
      });
      // No fim da faixa o último card não chega à margem esquerda: conta como ativo.
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) melhor = itens.current.length - 1;
      setAtivo(melhor);
    };
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    };
    atualizar();
    el.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      el.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, [produtos.length]);

  const irPara = useCallback((i: number) => {
    const el = trilho.current;
    const item = itens.current[i];
    if (!el || !item) return;
    const margem = parseFloat(getComputedStyle(el).scrollPaddingLeft || "0");
    el.scrollTo({ left: item.offsetLeft - margem, behavior: "smooth" });
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div>
      <div
        ref={trilho}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Produtos em destaque"
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 pt-1 scroll-px-4 sm:px-6 sm:scroll-px-6"
      >
        {produtos.map((produto, i) => (
          <div
            key={produto.id}
            ref={(el) => {
              itens.current[i] = el;
            }}
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${produtos.length}`}
            className="w-[66vw] max-w-[280px] shrink-0 snap-start"
            onClickCapture={(e) => {
              const el = trilho.current;
              const item = e.currentTarget;
              if (!el) return;
              const caixa = item.getBoundingClientRect();
              const tela = el.getBoundingClientRect();
              const visivel = Math.min(caixa.right, tela.right) - Math.max(caixa.left, tela.left);
              if (visivel / caixa.width >= 0.6) return;
              e.preventDefault();
              e.stopPropagation();
              irPara(i);
            }}
          >
            <ProductCard product={produto} />
          </div>
        ))}
      </div>

      <div className="container-page mt-4 flex items-center justify-between">
        <span className="text-sm tabular-nums text-neutral-500" aria-live="polite">
          <span className="font-medium text-brand-ink">{pad(ativo + 1)}</span> / {pad(produtos.length)}
        </span>
        <div className="flex">
          <button
            type="button"
            onClick={() => irPara(Math.max(0, ativo - 1))}
            disabled={ativo === 0}
            aria-label="Produto anterior"
            className="grid h-11 w-11 place-items-center border border-brand-ink/20 text-brand-ink active:bg-brand-ink/5 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => irPara(Math.min(produtos.length - 1, ativo + 1))}
            disabled={ativo === produtos.length - 1}
            aria-label="Próximo produto"
            className="-ml-px grid h-11 w-11 place-items-center border border-brand-ink/20 text-brand-ink active:bg-brand-ink/5 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
