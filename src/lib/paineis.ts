import { useSyncExternalStore } from "react";

/**
 * Qual painel sobreposto está aberto (menu, busca, categorias). Um só por vez,
 * e qualquer parte da tela pode abrir — o header no computador, a barra
 * inferior no celular — sem passar estado de mão em mão.
 */
export type Painel = "menu" | "busca" | "categorias" | null;

let atual: Painel = null;
const ouvintes = new Set<() => void>();

export function abrirPainel(painel: Exclude<Painel, null>) {
  atual = painel;
  ouvintes.forEach((o) => o());
}

export function fecharPainel() {
  if (atual === null) return;
  atual = null;
  ouvintes.forEach((o) => o());
}

function inscrever(o: () => void) {
  ouvintes.add(o);
  return () => ouvintes.delete(o);
}

export function usePainel(): Painel {
  return useSyncExternalStore(inscrever, () => atual, () => null);
}

/**
 * A barra inferior do celular some no checkout (foco total em finalizar) e na
 * página de produto (a barra de compra ocupa o lugar dela).
 */
export function barraInferiorVisivel(pathname: string) {
  return !pathname.startsWith("/checkout") && !pathname.startsWith("/produto/");
}
