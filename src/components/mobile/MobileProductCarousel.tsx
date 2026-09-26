import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "../../data/types";
import { ProductCard } from "../product/ProductCard";
import { useExperiencia3D } from "../../lib/experiencia3d";

/**
 * Carrossel de produtos em perspectiva (celular e tablet):
 *
 *        [ PRODUTO ]
 *   [ PRODUTO ]   [ PRODUTO ]
 *
 * A rolagem é a nativa do navegador (inércia e snapping de aplicativo, sem
 * brigar com a rolagem vertical da página); a cada quadro de rolagem, cada
 * card recebe profundidade conforme a distância do centro: o do meio fica
 * maior, na frente e aceso; os laterais recuam no eixo Z, giram para o
 * centro e perdem opacidade. Só `transform` e `opacity` — compositor puro.
 *
 * Tocar num card lateral o traz para o centro (em vez de abrir); o central
 * funciona como qualquer card (tocar levanta, nome abre o produto).
 */
export function MobileProductCarousel({ produtos }: { produtos: Product[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const itens = useRef<(HTMLDivElement | null)[]>([]);
  const [ativo, setAtivo] = useState(0);
  const { profundidade } = useExperiencia3D();

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    let quadro = 0;
    const atualizar = () => {
      quadro = 0;
      const centro = el.scrollLeft + el.clientWidth / 2;
      let melhor = 0;
      let menor = Infinity;
      itens.current.forEach((item, i) => {
        if (!item) return;
        const d = (item.offsetLeft + item.offsetWidth / 2 - centro) / item.offsetWidth;
        const a = Math.min(Math.abs(d), 1);
        if (Math.abs(d) < menor) {
          menor = Math.abs(d);
          melhor = i;
        }
        if (!profundidade) {
          item.style.transform = "";
          item.style.opacity = "";
          return;
        }
        const giro = Math.max(-1, Math.min(1, d)) * -26;
        item.style.transform = `perspective(900px) translateZ(${-a * 110}px) rotateY(${giro}deg) scale(${1 - a * 0.12})`;
        item.style.opacity = String(1 - a * 0.45);
        item.style.zIndex = String(10 - Math.round(a * 5));
      });
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
  }, [produtos.length, profundidade]);

  const centralizar = useCallback((i: number) => {
    const el = trilho.current;
    const item = itens.current[i];
    if (!el || !item) return;
    el.scrollTo({ left: item.offsetLeft + item.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" });
  }, []);

  return (
    <div className="relative">
      <div
        ref={trilho}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Produtos em destaque"
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain py-10 [padding-inline:calc(50%-min(32vw,145px))]"
      >
        {produtos.map((produto, i) => (
          <div
            key={produto.id}
            ref={(el) => {
              itens.current[i] = el;
            }}
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${produtos.length}`}
            className="relative w-[64vw] max-w-[290px] shrink-0 snap-center [scroll-snap-stop:always]"
            style={{ willChange: profundidade ? "transform" : undefined }}
            onClickCapture={(e) => {
              if (i === ativo) return;
              e.preventDefault();
              e.stopPropagation();
              centralizar(i);
            }}
          >
            {/* Luz de palco sob o produto central. */}
            <span
              aria-hidden
              className={`pointer-events-none absolute -bottom-7 left-1/2 h-10 w-[86%] -translate-x-1/2 rounded-[50%] bg-brand-yellow/30 blur-2xl transition-opacity duration-500 ${
                i === ativo ? "opacity-100" : "opacity-0"
              }`}
            />
            <ProductCard product={produto} />
          </div>
        ))}
      </div>

      <div className="mt-1 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => centralizar(Math.max(0, ativo - 1))}
          disabled={ativo === 0}
          aria-label="Produto anterior"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white transition-transform active:scale-90 disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-1.5" aria-hidden>
          {produtos.map((p, i) => (
            <span
              key={p.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === ativo ? "w-6 bg-brand-yellow shadow-[0_0_10px_rgba(245,196,0,0.8)]" : "w-1.5 bg-white/30"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => centralizar(Math.min(produtos.length - 1, ativo + 1))}
          disabled={ativo === produtos.length - 1}
          aria-label="Próximo produto"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white transition-transform active:scale-90 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
