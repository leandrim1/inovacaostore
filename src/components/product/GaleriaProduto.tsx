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
 * - Deslizar troca de foto com a rolagem nativa (snap de aplicativo) — reta,
 *   sem efeito: a foto é o produto, e o 3D mora no botão "Ver em 3D".
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
  const { toque } = useExperiencia3D();
  const indiceRolado = useRef(ativa);

  // Rolagem → foto ativa.
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    let quadro = 0;
    const atualizar = () => {
      quadro = 0;
      const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      const melhor = Math.max(0, Math.min(imagens.length - 1, i));
      if (melhor !== indiceRolado.current) {
        indiceRolado.current = melhor;
        onTrocar(melhor);
      }
    };
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    };
    el.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      el.removeEventListener("scroll", aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, [imagens.length, onTrocar]);

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
      <div className="aspect-[4/5] overflow-hidden rounded-[3px] bg-neutral-100">
        <PlaceholderImage label="Em breve" />
      </div>
    );
  }

  const irPara = (i: number) => onTrocar(Math.max(0, Math.min(imagens.length - 1, i)));

  return (
    <div>
      <div className="relative">
        <div
          ref={trilho}
          role="region"
          aria-roledescription="galeria"
          aria-label={`Fotos de ${nome}`}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[3px] bg-neutral-100"
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
          <span className="pointer-events-none absolute left-3 top-3 bg-white/90 px-2 py-1 text-[11px] font-medium tabular-nums text-brand-ink">
            {ativa + 1} / {imagens.length}
          </span>
        )}
        <button
          type="button"
          onClick={onVer3D}
          className="absolute bottom-3 right-3 flex min-h-11 items-center gap-2 rounded-[3px] bg-brand-ink px-4 font-display text-[15px] tracking-[0.08em] text-white transition-colors hover:bg-black active:translate-y-px"
        >
          <Rotate3d size={17} strokeWidth={1.8} aria-hidden />
          Ver em 3D
        </button>
        {!toque && imagens.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => irPara(ativa - 1)}
              disabled={ativa === 0}
              aria-label="Foto anterior"
              className="absolute left-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-white text-brand-ink transition-colors hover:bg-neutral-200 disabled:opacity-0"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => irPara(ativa + 1)}
              disabled={ativa === imagens.length - 1}
              aria-label="Próxima foto"
              className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-white text-brand-ink transition-colors hover:bg-neutral-200 disabled:opacity-0"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {imagens.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {imagens.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => irPara(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={ativa === i}
              className={`h-20 w-16 shrink-0 overflow-hidden rounded-[2px] border-2 transition-colors ${
                ativa === i ? "border-brand-ink" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <PositionedImage src={img.url} alt="" desktopSettings={img.desktopSettings} mobileSettings={img.mobileSettings} />
            </button>
          ))}
        </div>
      )}
      {toque && (
        <p className="mt-2 text-xs text-neutral-500">
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
