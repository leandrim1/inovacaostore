import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ProdutoVitrine } from "./qualidade";

/**
 * O mesmo produto pendurado em CSS 3D — sem WebGL, sem Three.js.
 *
 * É a versão do nível "baixo" (aparelho fraco, economia de dados, "reduzir
 * movimento") e também o que aparece na hora, enquanto a cena WebGL carrega:
 * quando ela fica pronta, as duas trocam com um fade. Gira com o mesmo
 * arrasto (MotionValue em radianos) e inclina com o giroscópio; frente e
 * verso são faces reais (`backface-visibility`). A luz que corre pela foto e
 * a sombra no chão que estreita quando a peça vira de lado são o que dá
 * volume — fotografia montada em papel-cartão, pendurada no cabide da loja.
 */
const RAD = 180 / Math.PI;

export function ProdutoCSS({
  produto,
  rotacao,
  giroX,
  giroY,
  cabide = true,
  className = "",
}: {
  produto: ProdutoVitrine;
  rotacao: MotionValue<number>;
  giroX?: MotionValue<number>;
  giroY?: MotionValue<number>;
  cabide?: boolean;
  className?: string;
}) {
  const semGiro = useTransform(rotacao, () => 0);
  const gx = giroX ?? semGiro;
  const gy = giroY ?? semGiro;
  const rotateY = useTransform([rotacao, gx], ([r, x]: number[]) => (r + x * 0.22) * RAD);
  const rotateX = useTransform(gy, (y) => -y * 0.12 * RAD);
  // Luz de cima e da esquerda: ao girar, a parte que se afasta escurece.
  const luz = useTransform(rotateY, (d) => {
    const lado = Math.max(-1, Math.min(1, Math.sin(d / RAD)));
    return `linear-gradient(${lado > 0 ? 90 : 270}deg, rgba(0,0,0,0) 35%, rgba(0,0,0,${Math.abs(lado) * 0.45}) 100%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.1))`;
  });
  const sombraEscala = useTransform(rotateY, (d) => 0.5 + Math.abs(Math.cos(d / RAD)) * 0.5);

  return (
    // O tamanho sai da menor medida da área (container queries): a peça cabe
    // inteira tanto num palco alto e estreito quanto num largo e baixo.
    <div className={`relative flex h-full w-full flex-col items-center justify-center [container-type:size] [perspective:1000px] ${className}`}>
      <div className="relative h-[min(84cqh,105cqw)]">
        <motion.div
          className="relative aspect-[4/5] h-full [transform-style:preserve-3d]"
          style={{ rotateY, rotateX }}
        >
          {/* O cabide gira junto com a peça (é simétrico, então o verso fica certo). */}
          {cabide && (
            <svg aria-hidden viewBox="-110 -110 220 120" className="absolute -top-[16%] left-[18%] w-[64%]">
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
          {/* Frente: a foto num cartão fosco de borda fina. */}
          <div className="absolute inset-0 overflow-hidden rounded-[2px] bg-[#f2f0ea] p-[3px] shadow-[0_24px_40px_-24px_rgba(0,0,0,0.85)] [backface-visibility:hidden]">
            <img
              src={produto.imagem}
              alt=""
              draggable={false}
              className="h-full w-full select-none object-cover"
              style={{ objectPosition: `${produto.focoX}% ${produto.focoY}%` }}
            />
            <motion.span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: luz }} />
          </div>
          {/* Verso: a segunda foto ou a etiqueta preta da loja. */}
          <div className="absolute inset-0 overflow-hidden rounded-[2px] bg-[#f2f0ea] p-[3px] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {produto.verso ? (
              <img src={produto.verso} alt="" draggable={false} className="h-full w-full select-none object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center bg-[#141414] px-4 pt-[14%] text-center">
                <span className="h-5 w-5 rounded-full border-[3px] border-neutral-500 bg-black" aria-hidden />
                <span className="mt-[16%] font-display text-4xl leading-none text-brand-yellow">Inovação</span>
                <span className="font-display text-sm text-white/60">Store</span>
                <span className="mt-6 font-display text-lg leading-tight text-white">{produto.nome}</span>
                <span className="mt-auto pb-[12%] text-sm font-bold text-brand-yellow">{produto.preco}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <motion.span
        aria-hidden
        className="mt-[3%] h-3 w-[44%] rounded-[50%] bg-black/60 blur-md"
        style={{ scaleX: sombraEscala }}
      />
    </div>
  );
}
