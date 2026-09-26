import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useExperiencia3D } from "../../lib/experiencia3d";
import { inclinacaoX, inclinacaoY, useSensorInclinacao } from "../../lib/sensorInclinacao";

/**
 * Seção em camadas de profundidade — a mesma gramática visual em toda a loja:
 *
 *   fundo     (mais distante)  gradiente/piso, anda devagar com a rolagem
 *   ambiente                   brilhos amarelos, anda um pouco mais rápido
 *   conteúdo  (mais perto)     textos, produtos e CTAs, no fluxo normal
 *
 * A diferença de velocidade entre as camadas (e a inclinação do celular,
 * quando há giroscópio) é o que dá a sensação de profundidade, sem WebGL.
 * Com "reduzir movimento" as camadas ficam paradas.
 */
type Tom = "claro" | "creme" | "escuro";

const FUNDO: Record<Tom, string> = {
  claro: "bg-white",
  creme: "bg-brand-cream",
  escuro: "bg-brand-ink",
};

export function AnimatedSection({
  children,
  tom = "creme",
  className = "",
  id,
  piso = false,
}: {
  children: ReactNode;
  tom?: Tom;
  className?: string;
  id?: string;
  /** Piso de showroom em perspectiva (grade que some ao longe). */
  piso?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const { profundidade, toque } = useExperiencia3D();
  useSensorInclinacao(profundidade && toque);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const fundoY = useTransform(scrollYProgress, [0, 1], [-36, 36]);
  const ambienteY = useTransform(scrollYProgress, [0, 1], [-90, 90]);
  const fundoX = useTransform(inclinacaoX, (v) => v * -8);
  const ambienteX = useTransform(inclinacaoX, (v) => v * -20);
  const ambienteGiroY = useTransform(inclinacaoY, (v) => v * -12);
  const ambienteYFinal = useTransform([ambienteY, ambienteGiroY], ([a, b]: number[]) => a + b);

  const escuro = tom === "escuro";

  return (
    <section
      ref={ref}
      id={id}
      data-cabecalho-escuro={tom === "escuro" ? "" : undefined}
      className={`relative overflow-hidden ${FUNDO[tom]} ${className}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-y-12 inset-x-0"
        style={profundidade ? { y: fundoY, x: fundoX } : undefined}
      >
        {escuro ? (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(245,196,0,0.16),transparent_70%),radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(255,255,255,0.06),transparent_70%)]" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(245,196,0,0.09),transparent_70%)]" />
        )}
        {piso && (
          <div className="absolute inset-x-[-30%] bottom-0 h-[55%] [perspective:600px]">
            <div
              className={`absolute inset-0 origin-bottom [transform:rotateX(68deg)] [mask-image:linear-gradient(to_top,black,transparent_85%)] ${
                escuro
                  ? "bg-[linear-gradient(rgba(245,196,0,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(245,196,0,0.22)_1px,transparent_1px)]"
                  : "bg-[linear-gradient(rgba(10,10,10,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(10,10,10,0.08)_1px,transparent_1px)]"
              } bg-[size:44px_44px]`}
            />
          </div>
        )}
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={profundidade ? { y: ambienteYFinal, x: ambienteX } : undefined}
      >
        <span
          className={`absolute -left-24 top-[12%] h-64 w-64 rounded-full blur-3xl ${
            escuro ? "bg-brand-yellow/20" : "bg-brand-yellow/15"
          }`}
        />
        <span
          className={`absolute -right-20 bottom-[8%] h-72 w-72 rounded-full blur-3xl ${
            escuro ? "bg-white/[0.06]" : "bg-brand-yellow/10"
          }`}
        />
      </motion.div>

      {/* Posicionado sem z-index: fica acima das camadas sem criar contexto de
          empilhamento — um modal lá dentro continua cobrindo o header. */}
      <div className="relative">{children}</div>
    </section>
  );
}
