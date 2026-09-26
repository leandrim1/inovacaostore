import { Suspense, lazy, useEffect, useState, type RefObject } from "react";
import { useExperiencia3D } from "../../lib/experiencia3d";
import type { Entradas, ProdutoVitrine } from "./qualidade";
import { LimiteDaCena } from "./LimiteDaCena";

// O único ponto da home que puxa three/R3F/drei: vira um chunk separado,
// baixado só quando este componente decide montar a cena.
const HeroScene = lazy(() => import("./HeroScene"));

/**
 * Porteiro da cena 3D do hero. Decide SE e QUANDO a cena entra:
 * - nunca no nível "baixo" (quem monta mostra a versão em CSS);
 * - só depois que a página terminou de carregar e o navegador ficou ocioso —
 *   a foto e o título do hero (o que aparece primeiro) nunca disputam rede ou
 *   CPU com o Three.js;
 * - parada (sem desenhar) quando a área sai da tela.
 * `onPronto` avisa quando o primeiro quadro saiu, para a versão em CSS que
 * estava no lugar sair com um fade. Se o chunk falhar ou o WebGL cair, a cena
 * some e a versão em CSS continua.
 */
export function CenaDoHero({
  layout,
  area,
  eventSource,
  produtos,
  entradas,
  onEscolher,
  crescer = true,
  onPronto,
  onFalha,
}: {
  layout: "vertical" | "leque";
  /** Elemento observado para pausar a cena fora da tela. */
  area: RefObject<HTMLElement | null>;
  eventSource?: RefObject<HTMLElement | null>;
  produtos: ProdutoVitrine[];
  entradas: Entradas;
  onEscolher: (slug: string) => void;
  /** O produto entra crescendo (troca de produto); na estreia aparece inteiro, trocando com a versão em CSS. */
  crescer?: boolean;
  /** Primeiro quadro (leque) ou foto do produto pronta (vertical). */
  onPronto?: () => void;
  onFalha?: () => void;
}) {
  const { nivel } = useExperiencia3D();
  const [liberada, setLiberada] = useState(false);
  const [naTela, setNaTela] = useState(true);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    if (nivel === "baixo") return;
    let cancelado = false;
    let ocioso: number | undefined;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const liberar = () => {
      if (!cancelado) setLiberada(true);
    };
    const agendar = () => {
      if ("requestIdleCallback" in window) ocioso = window.requestIdleCallback(liberar, { timeout: 2500 });
      else espera = setTimeout(liberar, 1200);
    };
    if (document.readyState === "complete") agendar();
    else window.addEventListener("load", agendar, { once: true });
    return () => {
      cancelado = true;
      window.removeEventListener("load", agendar);
      if (ocioso !== undefined) window.cancelIdleCallback(ocioso);
      if (espera !== undefined) clearTimeout(espera);
    };
  }, [nivel]);

  useEffect(() => {
    const el = area.current;
    if (!el || nivel === "baixo") return;
    const observador = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { rootMargin: "80px" });
    observador.observe(el);
    return () => observador.disconnect();
  }, [area, nivel]);

  if (nivel === "baixo" || !liberada || falhou || produtos.length === 0) return null;

  const falhar = () => {
    setFalhou(true);
    onFalha?.();
  };

  return (
    <LimiteDaCena onErro={falhar}>
      <Suspense fallback={null}>
        <HeroScene
          layout={layout}
          produtos={produtos}
          nivel={nivel}
          ativo={naTela}
          eventSource={eventSource}
          entradas={entradas}
          onEscolher={onEscolher}
          crescer={crescer}
          onPronto={() => onPronto?.()}
        />
      </Suspense>
    </LimiteDaCena>
  );
}
