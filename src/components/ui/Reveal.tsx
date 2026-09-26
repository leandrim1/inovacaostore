import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { comPerspectiva, useExperiencia3D } from "../../lib/experiencia3d";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}

const PERSPECTIVA = comPerspectiva(1100);

/**
 * Entrada ao rolar. Com profundidade ligada o bloco sobe de um leve ângulo,
 * como uma peça sendo erguida até a vitrine; sem ela (menos movimento), só
 * aparece. O `MotionConfig reducedMotion="user"` de main.tsx já corta o
 * deslocamento para quem pediu menos movimento — a checagem aqui evita até o
 * estado inicial inclinado.
 */
export function Reveal({ children, delay = 0, className, y = 24 }: RevealProps) {
  const { profundidade } = useExperiencia3D();

  return (
    <motion.div
      className={className}
      initial={profundidade ? { opacity: 0, y, rotateX: 12, scale: 0.97 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      transformTemplate={PERSPECTIVA}
      style={profundidade ? { transformOrigin: "50% 100%" } : undefined}
    >
      {children}
    </motion.div>
  );
}
