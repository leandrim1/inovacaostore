import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useMotionValue } from "framer-motion";

/**
 * Zoom de foto por gesto, para a galeria do produto:
 * - pinça com dois dedos amplia em torno do ponto entre eles (1× a 3×);
 * - com a foto ampliada, um dedo arrasta a foto (sem passar das bordas);
 * - toque duplo amplia 2× no ponto tocado, ou volta ao normal;
 * - no computador, duplo clique faz o mesmo.
 *
 * Usa eventos de toque (não de ponteiro) com `preventDefault` só quando o
 * gesto é nosso: sem zoom, o arrasto de um dedo continua sendo a rolagem da
 * página e o deslize da galeria. A área deve ter `touch-action: pan-x pan-y`
 * (o navegador não faz o zoom da página inteira por cima do nosso).
 */
const MAXIMO = 3;

function limitar(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function useZoomDeImagem() {
  const ref = useRef<HTMLDivElement>(null);
  const escala = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [ampliada, setAmpliada] = useState(false);

  const irPara = useCallback(
    (s: number, tx: number, ty: number) => {
      const mola = { type: "spring" as const, stiffness: 320, damping: 32 };
      animate(escala, s, mola);
      animate(x, tx, mola);
      animate(y, ty, mola);
      setAmpliada(s > 1.01);
    },
    [escala, x, y],
  );

  const resetar = useCallback(() => irPara(1, 0, 0), [irPara]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const caixa = () => el.getBoundingClientRect();
    const bordas = (s: number) => {
      const r = caixa();
      return { mx: ((s - 1) * r.width) / 2, my: ((s - 1) * r.height) / 2 };
    };
    const relativo = (cx: number, cy: number) => {
      const r = caixa();
      return { px: cx - (r.left + r.width / 2), py: cy - (r.top + r.height / 2) };
    };

    let pinca: { d0: number; s0: number; lx: number; ly: number } | null = null;
    let arrasto: { px: number; py: number; tx: number; ty: number } | null = null;
    let toque: { x: number; y: number; t: number } | null = null;
    let ultimoToque: { x: number; y: number; t: number } | null = null;

    const alternarNoPonto = (cx: number, cy: number) => {
      if (escala.get() > 1.01) {
        resetar();
        return;
      }
      const { px, py } = relativo(cx, cy);
      const { mx, my } = bordas(2);
      irPara(2, limitar(-px, -mx, mx), limitar(-py, -my, my));
    };

    const inicio = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const { px, py } = relativo((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
        const s0 = escala.get();
        pinca = {
          d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1,
          s0,
          lx: (px - x.get()) / s0,
          ly: (py - y.get()) / s0,
        };
        arrasto = null;
        toque = null;
        e.preventDefault();
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        toque = { x: t.clientX, y: t.clientY, t: e.timeStamp };
        arrasto = escala.get() > 1.01 ? { px: t.clientX, py: t.clientY, tx: x.get(), ty: y.get() } : null;
      }
    };

    const movimento = (e: TouchEvent) => {
      if (pinca && e.touches.length === 2) {
        e.preventDefault();
        const [a, b] = [e.touches[0], e.touches[1]];
        const s = limitar((pinca.s0 * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)) / pinca.d0, 1, MAXIMO);
        const { px, py } = relativo((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
        const { mx, my } = bordas(s);
        escala.set(s);
        x.set(limitar(px - s * pinca.lx, -mx, mx));
        y.set(limitar(py - s * pinca.ly, -my, my));
      } else if (arrasto && e.touches.length === 1) {
        e.preventDefault();
        const t = e.touches[0];
        const { mx, my } = bordas(escala.get());
        x.set(limitar(arrasto.tx + t.clientX - arrasto.px, -mx, mx));
        y.set(limitar(arrasto.ty + t.clientY - arrasto.py, -my, my));
      }
      if (toque && e.touches[0] && Math.hypot(e.touches[0].clientX - toque.x, e.touches[0].clientY - toque.y) > 12) {
        toque = null;
      }
    };

    const fim = (e: TouchEvent) => {
      if (e.touches.length < 2) pinca = null;
      if (e.touches.length > 0) return;
      arrasto = null;
      const s = escala.get();
      if (s < 1.05) resetar();
      else setAmpliada(true);

      // Toque duplo: dois toques curtos e parados, perto um do outro.
      if (toque && e.timeStamp - toque.t < 280) {
        if (ultimoToque && toque.t - ultimoToque.t < 320 && Math.hypot(toque.x - ultimoToque.x, toque.y - ultimoToque.y) < 36) {
          e.preventDefault();
          alternarNoPonto(toque.x, toque.y);
          ultimoToque = null;
        } else {
          ultimoToque = toque;
        }
      }
      toque = null;
    };

    const duploClique = (e: MouseEvent) => alternarNoPonto(e.clientX, e.clientY);

    el.addEventListener("touchstart", inicio, { passive: false });
    el.addEventListener("touchmove", movimento, { passive: false });
    el.addEventListener("touchend", fim, { passive: false });
    el.addEventListener("touchcancel", fim);
    el.addEventListener("dblclick", duploClique);
    return () => {
      el.removeEventListener("touchstart", inicio);
      el.removeEventListener("touchmove", movimento);
      el.removeEventListener("touchend", fim);
      el.removeEventListener("touchcancel", fim);
      el.removeEventListener("dblclick", duploClique);
    };
  }, [escala, x, y, irPara, resetar]);

  return { ref, escala, x, y, ampliada, resetar };
}
