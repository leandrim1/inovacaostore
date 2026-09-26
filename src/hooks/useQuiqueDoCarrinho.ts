import { useEffect, type RefObject } from "react";
import { EVENTO_POUSO } from "../lib/vooAoCarrinho";

/** O ícone do carrinho "quica" quando a cópia do produto pousa nele. */
export function useQuiqueDoCarrinho(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    function quicar() {
      const el = ref.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      el.animate(
        [
          { transform: "scale(1) translateY(0)" },
          { transform: "scale(1.28) translateY(-4px)" },
          { transform: "scale(0.9) translateY(0)" },
          { transform: "scale(1.06) translateY(-1px)" },
          { transform: "scale(1) translateY(0)" },
        ],
        { duration: 480, easing: "ease-out" },
      );
    }
    window.addEventListener(EVENTO_POUSO, quicar);
    return () => window.removeEventListener(EVENTO_POUSO, quicar);
  }, [ref]);
}
