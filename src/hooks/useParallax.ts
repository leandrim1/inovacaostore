import { useEffect, useRef, useState } from "react";

/**
 * Offset vertical (px) proporcional ao scroll enquanto o elemento está na tela —
 * usado para um leve parallax na imagem do hero. Fica parado se o usuário
 * preferir menos movimento.
 */
export function useParallax(strength = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let ticking = false;
    const update = () => {
      const rect = node.getBoundingClientRect();
      setOffset(rect.top * strength);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [strength]);

  return { ref, offset };
}
