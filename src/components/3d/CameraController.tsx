import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Entradas } from "./qualidade";

/**
 * Câmera que acompanha o gesto com atraso (amortecida): segue o arrasto do
 * dedo e a inclinação do celular por poucos centímetros, e recua quando a
 * seção sai da tela pela rolagem. Movimentos pequenos de propósito — a cena
 * nunca "balança".
 */
export function CameraController({
  entradas,
  base = [0, 0, 10],
  alvo = [0, 0, 0],
  rolagem,
  zoom,
}: {
  entradas: Entradas;
  base?: [number, number, number];
  alvo?: [number, number, number];
  /** 0 com a área inteira na tela, 1 quando já saiu por cima. */
  rolagem?: RefObject<number>;
  /** Aproximação extra (pinça do visualizador): 1 = normal. */
  zoom?: RefObject<number>;
}) {
  const olhar = new THREE.Vector3();

  useFrame((state, delta) => {
    const cam = state.camera;
    const giro = entradas.rotacao?.get() ?? 0;
    const gx = entradas.giroX?.get() ?? 0;
    const gy = entradas.giroY?.get() ?? 0;
    const p = rolagem?.current ?? 0;
    const z = zoom?.current ?? 1;

    // Limita o quanto a câmera acompanha o giro livre do visualizador.
    const acompanha = Math.max(-0.6, Math.min(0.6, giro));
    const x = base[0] + acompanha * 0.35 + gx * 0.28;
    const y = base[1] + gy * 0.18 + p * 0.6;
    const distancia = base[2] / z + p * 1.8;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, x, 3, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, y, 3, delta);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, distancia, 4, delta);
    cam.lookAt(olhar.set(alvo[0], alvo[1], alvo[2]));
  });

  return null;
}
