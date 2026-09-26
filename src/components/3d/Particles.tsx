import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useQualidade, type Entradas } from "./qualidade";

/**
 * Poeira luminosa amarela ao redor do produto. Um único `Points` (uma chamada
 * de desenho, a GPU anima tudo); a quantidade cai no modo econômico. Com o
 * celular inclinado, a nuvem anda um pouco ao contrário — é a camada que mais
 * denuncia a profundidade.
 */
export function Particles({ entradas, densidade = 1 }: { entradas: Entradas; densidade?: number }) {
  const grupo = useRef<THREE.Group>(null);
  const viewport = useThree((s) => s.viewport);
  const { economico } = useQualidade();

  useFrame((_, delta) => {
    const g = grupo.current;
    if (!g) return;
    const gx = entradas.giroX?.get() ?? 0;
    const gy = entradas.giroY?.get() ?? 0;
    g.position.x = THREE.MathUtils.damp(g.position.x, -gx * 0.45, 3, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, gy * 0.3, 3, delta);
  });

  return (
    <group ref={grupo}>
      <Sparkles
        count={Math.round((economico ? 22 : 60) * densidade)}
        scale={[viewport.width * 1.1, viewport.height * 1.1, 5]}
        position={[0, 0, -1]}
        size={economico ? 2.8 : 3.6}
        speed={0.3}
        opacity={0.75}
        noise={0.8}
        color="#f5c400"
      />
    </group>
  );
}
