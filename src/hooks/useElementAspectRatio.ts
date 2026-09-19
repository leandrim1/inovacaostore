import { useEffect, useState, type RefObject } from "react";

/** Mede a proporção (largura/altura) real de um elemento em tempo real, via ResizeObserver. */
export function useElementAspectRatio(ref: RefObject<HTMLElement | null>, fallback = 1) {
  const [aspect, setAspect] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setAspect(width / height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return aspect;
}
