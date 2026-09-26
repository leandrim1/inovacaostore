import { createContext, useContext, useEffect, type PointerEvent, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { comPerspectiva, useExperiencia3D } from "../../lib/experiencia3d";

/**
 * Inclinação 3D que acompanha o ponteiro, com reflexo de luz e sombra que se
 * desloca para o lado oposto — o card parece uma peça física sob um spot.
 *
 * Só existe com mouse (ver `useExperiencia3D`): no toque nada se mexe e o
 * componente vira uma `div` comum. Tudo roda em motion values, sem
 * re-renderizar o React a cada movimento do ponteiro.
 *
 * Dentro dele, `TiltCamada` desloca uma camada na direção oposta ao ponteiro
 * (a foto "afunda" dentro da moldura, o texto "sobe") — é o que dá a sensação
 * de profundidade sem precisar de `preserve-3d`, que o `overflow: hidden` dos
 * cards anularia.
 */

interface Ponteiro {
  x: MotionValue<number>;
  y: MotionValue<number>;
  ativo: MotionValue<number>;
}

const PonteiroContext = createContext<Ponteiro | null>(null);

const MOLA = { stiffness: 210, damping: 22, mass: 0.6 };
const PERSPECTIVA = comPerspectiva(1000);

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  /** Inclinação máxima, em graus, nas bordas. */
  max?: number;
  /** Reflexo de luz que segue o ponteiro. */
  brilho?: boolean;
  /** Sombra projetada que se move ao contrário da inclinação. */
  sombra?: boolean;
  /** Quanto o elemento sobe (px) enquanto o ponteiro está nele. */
  elevacao?: number;
  /** Congela na posição neutra (ex.: enquanto o seletor de tamanho está aberto). */
  pausado?: boolean;
}

export function Tilt3D({
  children,
  className = "",
  max = 7,
  brilho = true,
  sombra = false,
  elevacao = 0,
  pausado = false,
}: Tilt3DProps) {
  const { inclinacao } = useExperiencia3D();

  const alvoX = useMotionValue(0);
  const alvoY = useMotionValue(0);
  const presenca = useMotionValue(0);
  const x = useSpring(alvoX, MOLA);
  const y = useSpring(alvoY, MOLA);
  const ativo = useSpring(presenca, { stiffness: 170, damping: 24 });

  const rotateX = useTransform(y, (v) => -v * max * 2);
  const rotateY = useTransform(x, (v) => v * max * 2);
  const subida = useTransform(ativo, (v) => -v * elevacao);

  const luzX = useTransform(x, (v) => `${(v + 0.5) * 100}%`);
  const luzY = useTransform(y, (v) => `${(v + 0.5) * 100}%`);
  const reflexo = useMotionTemplate`radial-gradient(circle at ${luzX} ${luzY}, rgba(255,255,255,0.26), rgba(255,255,255,0.06) 38%, rgba(255,255,255,0) 62%)`;

  const sombraX = useTransform(x, (v) => -v * 28);
  const sombraY = useTransform([y, ativo], ([vy, a]: number[]) => 10 + a * 18 - vy * 20);
  const sombraAlfa = useTransform(ativo, (a) => 0.1 + a * 0.22);
  const projecao = useMotionTemplate`${sombraX}px ${sombraY}px 44px -20px rgba(0,0,0,${sombraAlfa})`;

  function soltar() {
    alvoX.set(0);
    alvoY.set(0);
    presenca.set(0);
  }

  useEffect(() => {
    if (pausado || !inclinacao) soltar();
    // `soltar` só mexe em motion values estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pausado, inclinacao]);

  function mover(e: PointerEvent<HTMLDivElement>) {
    if (!inclinacao || pausado || e.pointerType !== "mouse") return;
    const caixa = e.currentTarget.getBoundingClientRect();
    alvoX.set(Math.min(0.5, Math.max(-0.5, (e.clientX - caixa.left) / caixa.width - 0.5)));
    alvoY.set(Math.min(0.5, Math.max(-0.5, (e.clientY - caixa.top) / caixa.height - 0.5)));
    presenca.set(1);
  }

  if (!inclinacao) {
    return <div className={className}>{children}</div>;
  }

  return (
    <PonteiroContext.Provider value={{ x, y, ativo }}>
      <motion.div
        className={`relative ${className}`}
        onPointerMove={mover}
        onPointerLeave={soltar}
        transformTemplate={PERSPECTIVA}
        style={{ rotateX, rotateY, y: subida, boxShadow: sombra ? projecao : undefined }}
      >
        {children}
        {brilho && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[6] rounded-[inherit]"
            style={{ backgroundImage: reflexo, opacity: ativo }}
          />
        )}
      </motion.div>
    </PonteiroContext.Provider>
  );
}

interface TiltCamadaProps {
  children: ReactNode;
  className?: string;
  /**
   * Deslocamento máximo (px) nas bordas. Positivo afunda a camada (anda ao
   * contrário do ponteiro, como um fundo); negativo a traz para frente.
   */
  profundidade?: number;
  /** Giro extra em Y (graus) — a peça "vira" um pouco dentro da moldura. */
  giro?: number;
}

export function TiltCamada({ children, className, profundidade = 10, giro = 0 }: TiltCamadaProps) {
  const ponteiro = useContext(PonteiroContext);
  const parado = useMotionValue(0);
  const fonteX = ponteiro?.x ?? parado;
  const fonteY = ponteiro?.y ?? parado;
  const x = useTransform(fonteX, (v) => -v * profundidade * 2);
  const y = useTransform(fonteY, (v) => -v * profundidade * 2);
  const rotateY = useTransform(fonteX, (v) => v * giro * 2);

  return (
    <motion.div
      className={className}
      transformTemplate={PERSPECTIVA}
      style={ponteiro ? { x, y, rotateY } : undefined}
    >
      {children}
    </motion.div>
  );
}
