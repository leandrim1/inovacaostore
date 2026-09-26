import { useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { QualidadeContext } from "./qualidade";
import { EstudioDeLuz } from "./Lighting";
import { rebaixarNivel3D } from "../../lib/experiencia3d";

/**
 * O Canvas de toda cena 3D da loja — um lugar só para as regras de custo:
 *
 * - resolução pelo nível do aparelho (celular "alto" até 2×, "medio" 1,5×);
 * - `frameloop="never"` quando a área sai da tela: nada é desenhado;
 * - monitor de FPS: na primeira queda reduz resolução, partículas e sombras;
 *   se mesmo assim ficar abaixo de ~28 FPS, o aparelho passa para o nível
 *   "baixo" e a cena é trocada pela versão em CSS (quem montou a cena escuta
 *   `useExperiencia3D`);
 * - contexto WebGL perdido (celular sem memória) → mesmo caminho.
 *
 * Nunca há duas destas na mesma página: a home tem a do hero, o produto tem
 * a do "Ver em 3D".
 */
interface Props {
  nivel: "alto" | "medio";
  ativo: boolean;
  camera: { position: [number, number, number]; fov: number };
  /** Elemento que recebe o ponteiro, quando o canvas fica por baixo de outras camadas. */
  eventSource?: RefObject<HTMLElement | null>;
  /** Sombras reais (só compensa no computador). */
  sombras?: boolean;
  onPronto?: () => void;
  children: ReactNode;
}

export function ProductScene({ nivel, ativo, camera, eventSource, sombras = false, onPronto, children }: Props) {
  const toque = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const [dprMax, setDprMax] = useState(nivel === "alto" ? (toque ? 2 : 1.75) : toque ? 1.5 : 1.25);
  const [economico, setEconomico] = useState(nivel !== "alto");
  // Quedas de FPS seguidas. Uma só pode ser o carregamento (texturas,
  // compilação de shaders); duas seguidas abaixo de ~28 FPS é o aparelho.
  const quedas = useRef(0);

  return (
    <Canvas
      dpr={[1, dprMax]}
      frameloop={ativo ? "always" : "never"}
      shadows={sombras && !economico ? "percentage" : false}
      camera={{ position: camera.position, fov: camera.fov, near: 0.1, far: 40 }}
      gl={{ antialias: nivel === "alto", alpha: true, powerPreference: "high-performance", stencil: false }}
      eventSource={eventSource as RefObject<HTMLElement> | undefined}
      eventPrefix={eventSource ? "client" : undefined}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          rebaixarNivel3D("baixo");
        });
        requestAnimationFrame(() => onPronto?.());
      }}
    >
      <PerformanceMonitor
        onIncline={() => {
          quedas.current = 0;
        }}
        onDecline={({ fps }) => {
          quedas.current += 1;
          setDprMax(1);
          setEconomico(true);
          if (quedas.current >= 2 && fps > 0 && fps < 28) rebaixarNivel3D("baixo");
        }}
      />
      <QualidadeContext.Provider value={{ economico }}>
        <EstudioDeLuz />
        {children}
      </QualidadeContext.Provider>
    </Canvas>
  );
}
