import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useExperiencia3D } from "../../lib/experiencia3d";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}

/**
 * Entrada ao rolar: o bloco aparece subindo alguns pixels, uma vez só. É
 * curta e igual em toda a loja de propósito — a página não "se monta" na
 * frente de quem só quer ver as peças. Com "reduzir movimento", só aparece.
 */
export function Reveal({ children, delay = 0, className, y = 14 }: RevealProps) {
  const { reduzido } = useExperiencia3D();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduzido ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
