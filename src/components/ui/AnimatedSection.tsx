import type { ReactNode } from "react";

/**
 * Seção da home com o fundo da vez. O ritmo da página vem da alternância de
 * tons (creme, branco, preto) e do espaço — não de brilhos e camadas se
 * mexendo atrás do conteúdo. As seções escuras avisam o header
 * (`data-cabecalho-escuro`) para ele trocar de tom por cima delas.
 */
type Tom = "claro" | "creme" | "escuro";

const FUNDO: Record<Tom, string> = {
  claro: "bg-white",
  creme: "bg-brand-cream",
  escuro: "bg-brand-ink text-white",
};

export function AnimatedSection({
  children,
  tom = "creme",
  className = "",
  id,
}: {
  children: ReactNode;
  tom?: Tom;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      data-cabecalho-escuro={tom === "escuro" ? "" : undefined}
      className={`relative ${FUNDO[tom]} ${className}`}
    >
      {children}
    </section>
  );
}
