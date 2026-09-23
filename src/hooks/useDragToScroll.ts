import { useEffect, type RefObject } from "react";

/** Quanto o mouse precisa andar para virar arrasto (abaixo disso é clique). */
const LIMIAR_ARRASTO = 6;
/** Arrasto maior que isto sempre avança/volta pelo menos um item. */
const LIMIAR_INTENCAO = 40;

/**
 * Ponto de parada (scroll-snap) mais próximo de `left`. Com um arrasto
 * decidido, não deixa voltar para onde estava: puxou para o lado, anda.
 */
function pontoDeParada(el: HTMLElement, left: number, dx: number) {
  const recuo = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
  const max = el.scrollWidth - el.clientWidth;
  const pontos = [
    ...new Set(
      Array.from(el.children, (c) => Math.min(max, Math.max(0, (c as HTMLElement).offsetLeft - recuo))),
    ),
  ].sort((a, b) => a - b);
  if (pontos.length === 0) return left;

  let i = 0;
  for (let j = 1; j < pontos.length; j++) {
    if (Math.abs(pontos[j] - left) < Math.abs(pontos[i] - left)) i = j;
  }
  if (dx <= -LIMIAR_INTENCAO && pontos[i] < left - 1 && i < pontos.length - 1) i++;
  if (dx >= LIMIAR_INTENCAO && pontos[i] > left + 1 && i > 0) i--;
  return pontos[i];
}

/**
 * Deixa arrastar com o mouse uma lista de rolagem horizontal.
 *
 * Toque e trackpad já rolam sozinhos (com inércia e scroll-snap do
 * navegador); isto cobre só o mouse no computador, onde a rolagem lateral
 * não existe. Durante o arrasto marca `data-dragging="true"` no elemento —
 * o CSS usa isso para desligar o snap (senão ele puxa a lista a cada
 * quadro) e mostrar a mãozinha fechada. Ao soltar, desliza até o item mais
 * próximo e só então devolve o snap.
 */
export function useDragToScroll(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let ponteiro: number | null = null;
    let inicioX = 0;
    let inicioLeft = 0;
    let arrastou = false;

    function soltarSnap() {
      delete el!.dataset.dragging;
    }

    function onDown(e: PointerEvent) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      ponteiro = e.pointerId;
      inicioX = e.clientX;
      inicioLeft = el!.scrollLeft;
      arrastou = false;
    }

    function onMove(e: PointerEvent) {
      if (ponteiro !== e.pointerId) return;
      const dx = e.clientX - inicioX;
      if (!arrastou) {
        if (Math.abs(dx) < LIMIAR_ARRASTO) return;
        arrastou = true;
        el!.setPointerCapture(e.pointerId);
        el!.dataset.dragging = "true";
      }
      el!.scrollLeft = inicioLeft - dx;
    }

    function onUp(e: PointerEvent) {
      if (ponteiro !== e.pointerId) return;
      ponteiro = null;
      if (!arrastou) return;

      const alvo = pontoDeParada(el!, el!.scrollLeft, e.clientX - inicioX);
      const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (semAnimacao || Math.abs(alvo - el!.scrollLeft) < 1) {
        el!.scrollLeft = alvo;
        soltarSnap();
        return;
      }
      el!.scrollTo({ left: alvo, behavior: "smooth" });
      // O snap só volta quando a animação acaba; religado antes, o navegador
      // "pula" para o ponto em vez de deslizar.
      if ("onscrollend" in window) el!.addEventListener("scrollend", soltarSnap, { once: true });
      else setTimeout(soltarSnap, 450);
    }

    // Um arrasto que termina em cima de um botão ("Ler mais") não é clique.
    function onClickCapture(e: MouseEvent) {
      if (!arrastou) return;
      e.preventDefault();
      e.stopPropagation();
      arrastou = false;
    }

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClickCapture, true);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("scrollend", soltarSnap);
      soltarSnap();
    };
  }, [ref, enabled]);
}
