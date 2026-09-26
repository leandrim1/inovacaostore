import { createContext, useContext } from "react";
import type { MotionValue } from "framer-motion";
import type { Product } from "../../data/types";
import { formatBRL } from "../../lib/format";

/**
 * Qualidade corrente dentro de um Canvas: começa pelo nível do aparelho e o
 * monitor de desempenho pode baixar em tempo real (menos partículas, sem
 * sombras reais, geometria mais simples).
 */
export const QualidadeContext = createContext({ economico: true });

export function useQualidade() {
  return useContext(QualidadeContext);
}

/** Produto como a cena precisa: só o necessário para desenhar e navegar. */
export interface ProdutoVitrine {
  id: string;
  slug: string;
  nome: string;
  preco: string;
  imagem: string;
  /** Segunda foto (costas/outro ângulo). Sem ela, o verso é uma etiqueta da loja. */
  verso?: string;
  /** Ponto de interesse da foto (0–100), vindo do enquadramento do painel. */
  focoX: number;
  focoY: number;
}

/**
 * O que move a cena além do mouse: o arrasto do dedo (rotação, em radianos)
 * e a inclinação do celular (-1..1). Todos MotionValues — lidos a cada quadro,
 * sem re-render do React.
 */
export interface Entradas {
  rotacao?: MotionValue<number>;
  arrastando?: MotionValue<number>;
  giroX?: MotionValue<number>;
  giroY?: MotionValue<number>;
  /** Usar o ponteiro do R3F (mouse sobre a área) — só no computador. */
  ponteiro?: boolean;
}

/** Converte o produto da API no formato da cena (sem foto, fica de fora). */
export function paraVitrine(p: Product): ProdutoVitrine | null {
  const foto = p.imageDetails[0];
  if (!foto || p.comingSoon) return null;
  return {
    id: p.id,
    slug: p.slug,
    nome: p.name,
    preco: formatBRL(p.price),
    imagem: foto.url,
    verso: p.imageDetails[1]?.url,
    focoX: foto.desktopSettings?.positionX ?? 50,
    focoY: foto.desktopSettings?.positionY ?? 50,
  };
}
