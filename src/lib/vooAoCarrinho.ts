/**
 * Microinteração de "adicionar ao carrinho", em 5 tempos (~700 ms):
 *
 * 1. a foto de origem dá um pequeno "pulso" de escala;
 * 2. uma cópia da foto se descola dela;
 * 3. a cópia voa num arco até o ícone do carrinho visível na tela (barra
 *    inferior no celular, header no computador, barra de compra na página
 *    do produto);
 * 4. o ícone recebe um quique (`EVENTO_POUSO`, ver `useQuiqueDoCarrinho`);
 * 5. aparece o aviso de sucesso (`EVENTO_ADICIONADO`, ver `AvisoCarrinho`).
 *
 * Tudo em Web Animations (compositor), sem estado do React. Com "reduzir
 * movimento" só o aviso aparece. Nada aqui toca no carrinho em si: quem
 * adiciona continua sendo o `CartContext`.
 */
export const EVENTO_POUSO = "inovacao:carrinho-pouso";
export const EVENTO_ADICIONADO = "inovacao:carrinho-adicionado";

export interface InfoAdicionado {
  nome: string;
  imagem?: string;
  detalhe?: string;
}

const DURACAO = 700;

function alvoVisivel(): HTMLElement | null {
  const candidatos = Array.from(document.querySelectorAll<HTMLElement>("[data-alvo-carrinho]"));
  return (
    candidatos.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== "hidden";
    }) ?? null
  );
}

export function celebrarAdicao(origem: Element | null, info: InfoAdicionado) {
  const avisar = () => window.dispatchEvent(new CustomEvent<InfoAdicionado>(EVENTO_ADICIONADO, { detail: info }));
  const pousar = () => {
    window.dispatchEvent(new Event(EVENTO_POUSO));
    navigator.vibrate?.(12);
  };

  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const alvo = alvoVisivel();
  const caixa = origem?.getBoundingClientRect();

  if (reduzido || !origem || !caixa || caixa.width === 0 || !alvo) {
    pousar();
    avisar();
    return;
  }

  origem.animate(
    [{ transform: "scale(1)" }, { transform: "scale(0.94)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }],
    { duration: 380, easing: "ease-out" },
  );

  const lado = Math.min(caixa.width, caixa.height, 150);
  const inicioX = caixa.left + caixa.width / 2 - lado / 2;
  const inicioY = caixa.top + caixa.height / 2 - lado / 2;
  const destino = alvo.getBoundingClientRect();
  const dx = destino.left + destino.width / 2 - (inicioX + lado / 2);
  const dy = destino.top + destino.height / 2 - (inicioY + lado / 2);

  const copia = document.createElement(info.imagem ? "img" : "div");
  if (copia instanceof HTMLImageElement && info.imagem) {
    copia.src = info.imagem;
    copia.alt = "";
  }
  copia.setAttribute("aria-hidden", "true");
  Object.assign(copia.style, {
    position: "fixed",
    left: `${inicioX}px`,
    top: `${inicioY}px`,
    width: `${lado}px`,
    height: `${lado}px`,
    objectFit: "cover",
    borderRadius: "18px",
    background: "#f5c400",
    boxShadow: "0 18px 40px -12px rgba(0,0,0,0.55), 0 0 0 2px rgba(245,196,0,0.9)",
    zIndex: "95",
    pointerEvents: "none",
    willChange: "transform, opacity",
  });
  document.body.appendChild(copia);

  // Arco: sobe um pouco antes de cair no carrinho, girando e encolhendo.
  const voo = copia.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 110}px) scale(0.62) rotate(-10deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.14) rotate(8deg)`, opacity: 0.35 },
    ],
    { duration: DURACAO, easing: "cubic-bezier(0.45, 0, 0.2, 1)", fill: "forwards" },
  );
  voo.onfinish = () => {
    copia.remove();
    pousar();
    avisar();
  };
  voo.oncancel = () => copia.remove();
}
