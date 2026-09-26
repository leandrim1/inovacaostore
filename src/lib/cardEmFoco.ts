import { useSyncExternalStore } from "react";

/**
 * Qual card de produto está "levantado" pelo toque. Um só por vez: tocar em
 * outro card, fora dele ou rolar para longe devolve o anterior ao plano.
 */
let emFoco: string | null = null;
const ouvintes = new Set<() => void>();

export function focarCard(chave: string | null) {
  if (emFoco === chave) return;
  emFoco = chave;
  ouvintes.forEach((o) => o());
}

function inscrever(o: () => void) {
  ouvintes.add(o);
  return () => ouvintes.delete(o);
}

export function useCardEmFoco(chave: string) {
  return useSyncExternalStore(inscrever, () => emFoco === chave, () => false);
}
