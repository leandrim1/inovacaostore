import { useEffect } from "react";

/**
 * Trava o scroll da página por trás enquanto um menu/drawer/modal em tela
 * cheia está aberto. Precisa travar tanto `body` quanto `html`: em modo
 * standards o elemento que realmente rola a página é `document.documentElement`
 * (`document.scrollingElement`), não `body` — travar só o `body` não impede
 * o scroll de fundo.
 */
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const { body } = document;
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
    };
  }, [isOpen]);
}
