import { useEffect, useRef, type RefObject } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Rotate3d } from "lucide-react";
import type { ProductImageDetail } from "../../data/types";
import { PositionedImage } from "../ui/PositionedImage";
import { PlaceholderImage } from "../ui/PlaceholderImage";
import { useZoomDeImagem } from "../../hooks/useZoomDeImagem";
import { useExperiencia3D } from "../../lib/experiencia3d";

/**
 * Galeria da página de produto.
 *
 * - Deslizar troca de foto com a rolagem nativa (snap de aplicativo); cada
 *   foto gira como a face de um prisma ao passar, então trocar de foto
 *   parece girar a peça.
 * - Pinça amplia, toque duplo amplia/volta, com a foto ampliada um dedo
 *   passeia por ela (ver `useZoomDeImagem`).
 * - "Ver em 3D" abre o visualizador em tela cheia.
 * - Miniaturas continuam valendo (e no computador são o jeito principal).
 */
export function GaleriaProduto({
  imagens,
  nome,
  ativa,
  onTrocar,
  onVer3D,
  fotoAtualRef,
}: {
  imagens: ProductImageDetail[];
  nome: string;
  ativa: number;
  onTrocar: (i: number) => void;
  onVer3D: () => void;
  /** Recebe a foto visível — é de onde sai o "voo" ao adicionar ao carrinho. */
  fotoAtualRef: RefObject<HTMLDivElement | null>;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLDivElement | null)[]>([]);
  const { profundidade, toque } = useExperiencia3D();
  const indiceRolado = useRef(ativa);

  // Rolagem → foto ativa + giro de prisma em cada face.
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    let quadro = 0;
    const atualizar = () => {
      quadro = 0;
      const centro = el.scrollLeft + el.clientWidth / 2;
      let melhor = 0;
      let menor = Infinity;
      slides.current.forEach((slide, i) => {
        if (!slide) return;
        const d = (slide.offsetLeft + slide.offsetWidth / 2 - centro) / slide.offsetWidth;
        if (Math.abs(d) < menor) {
          menor = Math.abs(d);
          melhor = i;
        }
        const face = slide.firstElementChild as HTMLElement | null;
        if (!face) return;
        if (!profundidade) {
          face.style.transform = "";
          return;
        }
        const a = Math.max(-1, Math.min(1, d));
        face.style.transformOrigin = a < 0 ? "100% 50%" : "0% 50%";
        face.style.transform = `perspective(1100px) rotateY(${-a * 42}deg) scale(${1 - Math.abs(a) * 0.06})`;
        face.style.opacity = String(1 - Math.abs(a) * 0.35);
      });
      if (melhor !== indiceRolado.current) {
        indiceRolado.current = melhor;
        onTrocar(melhor);
      }
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
  }, [imagens.length, profundidade, onTrocar]);

  // Miniatura/seta escolheu outra foto → leva o trilho até ela.
  useEffect(() => {
    const el = trilho.current;
    const alvo = slides.current[ativa];
    if (!el || !alvo || indiceRolado.current === ativa) return;
    indiceRolado.current = ativa;
    el.scrollTo({ left: alvo.offsetLeft, behavior: "smooth" });
  }, [ativa]);

  if (imagens.length === 0) {
    return (
      <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-brand-ink/10 bg-neutral-100">
        <PlaceholderImage label="Em breve" />
      </div>
    );
  }

  const irPara = (i: number) => onTrocar(Math.max(0, Math.min(imagens.length - 1, i)));

  return (
    <div className="relative">
      <div
        ref={trilho}
        role="region"
        aria-roledescription="galeria"
        aria-label={`Fotos de ${nome}`}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl border border-brand-ink/10 bg-neutral-100 shadow-[0_30px_50px_-34px_rgba(0,0,0,0.55)]"
      >
        {imagens.map((img, i) => (
          <div
            key={img.id}
            ref={(el) => {
              slides.current[i] = el;
            }}
            className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden"
            aria-roledescription="foto"
            aria-label={`${i + 1} de ${imagens.length}`}
          >
            <FotoAmpliavel
              imagem={img}
              nome={nome}
              atual={i === ativa}
              fotoAtualRef={i === ativa ? fotoAtualRef : undefined}
            />
          </div>
        ))}
      </div>

      {/* Camada de primeiro plano: contador, 3D e setas (computador). */}
      {imagens.length > 1 && (
        <span className="vidro-escuro pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-1 font-mono text-[11px] tabular-nums text-white">
          {ativa + 1}/{imagens.length}
        </span>
      )}
      <button
        type="button"
        onClick={onVer3D}
        className="vidro-escuro absolute bottom-3 right-3 flex min-h-11 items-center gap-2 rounded-full px-4 font-display text-xs tracking-[0.18em] text-white transition-transform active:scale-95"
      >
        <Rotate3d size={17} className="text-brand-yellow" aria-hidden />
        Ver em 3D
      </button>
      {!toque && imagens.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => irPara(ativa - 1)}
            disabled={ativa === 0}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-ink shadow-md transition hover:scale-105 disabled:opacity-0"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => irPara(ativa + 1)}
            disabled={ativa === imagens.length - 1}
            aria-label="Próxima foto"
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-ink shadow-md transition hover:scale-105 disabled:opacity-0"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {imagens.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {imagens.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => irPara(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={ativa === i}
              className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all active:scale-95 ${
                ativa === i ? "border-brand-ink shadow-[0_6px_14px_-8px_rgba(0,0,0,0.6)]" : "border-transparent opacity-70 hover:border-brand-ink/30"
              }`}
            >
              <PositionedImage src={img.url} alt="" desktopSettings={img.desktopSettings} mobileSettings={img.mobileSettings} />
            </button>
          ))}
        </div>
      )}
      {toque && (
        <p className="mt-2 text-center text-[11px] text-neutral-400">
          Deslize para trocar · pinça ou toque duplo para ampliar
        </p>
      )}
    </div>
  );
}

function FotoAmpliavel({
  imagem,
  nome,
  atual,
  fotoAtualRef,
}: {
  imagem: ProductImageDetail;
  nome: string;
  atual: boolean;
  fotoAtualRef?: RefObject<HTMLDivElement | null>;
}) {
  const { ref, escala, x, y, ampliada, resetar } = useZoomDeImagem();

  // Ao sair de cena, a foto volta ao tamanho normal.
  useEffect(() => {
    if (!atual) resetar();
  }, [atual, resetar]);

  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (fotoAtualRef) fotoAtualRef.current = el;
      }}
      className="absolute inset-0"
      style={{ touchAction: ampliada ? "none" : "pan-x pan-y" }}
    >
      <motion.div className="absolute inset-0" style={{ scale: escala, x, y }}>
        <PositionedImage
          src={imagem.url}
          alt={nome}
          draggable={false}
          desktopSettings={imagem.desktopSettings}
          mobileSettings={imagem.mobileSettings}
          className="select-none"
        />
      </motion.div>
    </div>
  );
}
