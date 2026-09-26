import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ProdutoVitrine } from "./qualidade";

/**
 * O mesmo produto flutuante em CSS 3D — sem WebGL, sem Three.js.
 *
 * É a versão do nível "baixo" (aparelho fraco, economia de dados, "reduzir
 * movimento") e também o que aparece na hora, enquanto a cena WebGL carrega:
 * quando ela fica pronta, as duas trocam com um fade. Gira com o mesmo
 * arrasto (MotionValue em radianos) e inclina com o giroscópio; frente e
 * verso são faces reais (`backface-visibility`), o brilho corre com o giro e
 * a sombra no chão estreita quando a peça vira de lado.
 */
const RAD = 180 / Math.PI;

export function ProdutoCSS({
  produto,
  rotacao,
  giroX,
  giroY,
  flutuar = true,
  cabide = true,
  className = "",
}: {
  produto: ProdutoVitrine;
  rotacao: MotionValue<number>;
  giroX?: MotionValue<number>;
  giroY?: MotionValue<number>;
  flutuar?: boolean;
  cabide?: boolean;
  className?: string;
}) {
  const semGiro = useTransform(rotacao, () => 0);
  const gx = giroX ?? semGiro;
  const gy = giroY ?? semGiro;
  const rotateY = useTransform([rotacao, gx], ([r, x]: number[]) => (r + x * 0.22) * RAD);
  const rotateX = useTransform(gy, (y) => -y * 0.12 * RAD);
  const brilhoX = useTransform(rotateY, (d) => `${50 - d * 1.4}%`);
  const brilho = useTransform(brilhoX, (x) => `radial-gradient(circle at ${x} 20%, rgba(255,255,255,0.32), rgba(255,255,255,0) 55%)`);
  const sombraEscala = useTransform(rotateY, (d) => 0.55 + Math.abs(Math.cos(d / RAD)) * 0.45);

  return (
    <div className={`relative flex h-full w-full flex-col items-center justify-center [perspective:900px] ${className}`}>
      <div className={`relative h-[82%] ${flutuar ? "animate-float motion-reduce:animate-none" : ""}`}>
        <motion.div
          className="relative aspect-[4/5] h-full [transform-style:preserve-3d]"
          style={{ rotateY, rotateX }}
        >
          {/* O cabide gira junto com a peça (é simétrico, então o verso fica certo). */}
          {cabide && (
            <svg
              aria-hidden
              viewBox="-110 -110 220 120"
              className="absolute -top-[17%] left-[18%] w-[64%] drop-shadow-[0_4px_10px_rgba(245,196,0,0.35)]"
            >
              <path
                d="M-16 -84 C-12 -100 12 -102 12 -86 C12 -72 2 -66 0 -56 L-98 -2 Q-104 8 -90 10 L90 10 Q104 8 98 -2 L0 -56"
                fill="none"
                stroke="#f5c400"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {/* Frente */}
          <div className="absolute inset-0 overflow-hidden rounded-[20px] bg-neutral-900 p-[5px] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.8)] ring-1 ring-white/25 [backface-visibility:hidden] [background-image:linear-gradient(145deg,rgba(255,255,255,0.35),rgba(255,255,255,0.05)_40%,rgba(255,255,255,0.18))]">
            <img src={produto.imagem} alt="" draggable={false} className="h-full w-full select-none rounded-[15px] object-cover" style={{ objectPosition: `${produto.focoX}% ${produto.focoY}%` }} />
            <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px]" style={{ backgroundImage: brilho }} />
            <span aria-hidden className="absolute bottom-[3px] left-1/2 h-[3px] w-1/3 -translate-x-1/2 rounded-full bg-brand-yellow shadow-[0_0_10px_rgba(245,196,0,0.9)]" />
          </div>
          {/* Verso */}
          <div className="absolute inset-0 overflow-hidden rounded-[20px] bg-brand-ink p-[5px] ring-1 ring-white/20 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {produto.verso ? (
              <img src={produto.verso} alt="" draggable={false} className="h-full w-full select-none rounded-[15px] object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[15px] border border-brand-yellow/50 bg-[radial-gradient(circle_at_50%_0%,rgba(245,196,0,0.22),transparent_65%)] px-4 text-center">
                <span className="font-display text-4xl text-brand-yellow">Inovação</span>
                <span className="font-display text-[10px] tracking-[0.5em] text-white/70">Store</span>
                <span className="mt-4 font-display text-lg leading-tight text-white">{produto.nome}</span>
                <span className="text-sm font-bold text-brand-yellow">{produto.preco}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <motion.span
        aria-hidden
        className="mt-[4%] h-4 w-[46%] rounded-[50%] bg-black/55 blur-md"
        style={{ scaleX: sombraEscala }}
      />
    </div>
  );
}
