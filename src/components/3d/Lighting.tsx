import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Entradas } from "./qualidade";


/**
 * Mapa de reflexo feito na hora: um estúdio de fotografia de produto
 * (softbox em cima, rebatedores neutros nas laterais, parede ao fundo)
 * renderizado uma única vez para um PMREM. Luz branca, sem cor: quem dá cor
 * à cena é a própria peça.
 */
export function EstudioDeLuz() {
  const get = useThree((s) => s.get);

  useEffect(() => {
    // Lidos do estado do R3F dentro do efeito: a cena é um objeto do Three,
    // não um valor do React, e é aqui que ela recebe o mapa de reflexo.
    const { gl, scene } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const estudio = new THREE.Scene();
    const plano = new THREE.PlaneGeometry(1, 1);
    const luz = (cor: string, forca: number, pos: [number, number, number], escala: [number, number]) => {
      const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(forca), side: THREE.DoubleSide });
      const m = new THREE.Mesh(plano, material);
      m.position.set(...pos);
      m.scale.set(escala[0], escala[1], 1);
      m.lookAt(0, 0, 0);
      estudio.add(m);
    };
    luz("#ffffff", 2.6, [0, 6, 2], [12, 3]);
    luz("#f4f1ea", 1.1, [-7, 0.5, 0], [3, 9]);
    luz("#ffffff", 1.2, [7, 1, 4], [3, 6]);
    luz("#d9d6cf", 0.35, [0, -1, -9], [18, 6]);

    const alvo = pmrem.fromScene(estudio, 0.03);
    scene.environment = alvo.texture;

    return () => {
      scene.environment = null;
      alvo.dispose();
      pmrem.dispose();
      plano.dispose();
      estudio.traverse((o) => {
        if (o instanceof THREE.Mesh) (o.material as THREE.Material).dispose();
      });
    };
  }, [get]);

  return null;
}

/**
 * Luz-chave que acompanha o gesto: o mouse no computador, o arrasto do dedo e
 * a inclinação do celular no toque. Girar a peça faz a luz correr pela
 * superfície e a sombra mudar — é o que faz o objeto parecer iluminado de
 * verdade. Um preenchimento baixo do lado oposto evita o verso "morto".
 */
export function LuzesDinamicas({
  entradas,
  centro = [0, 0],
  sombras = false,
}: {
  entradas: Entradas;
  centro?: [number, number];
  sombras?: boolean;
}) {
  const spot = useRef<THREE.SpotLight>(null);

  useFrame((state, delta) => {
    const s = spot.current;
    if (!s) return;
    const px = entradas.ponteiro ? state.pointer.x : 0;
    const py = entradas.ponteiro ? state.pointer.y : 0;
    const giro = entradas.rotacao?.get() ?? 0;
    const gx = entradas.giroX?.get() ?? 0;
    const gy = entradas.giroY?.get() ?? 0;
    const fx = px * 4.5 - giro * 3.2 + gx * 2.2;
    const fy = py * 3 - gy * 1.6;
    s.position.x = THREE.MathUtils.damp(s.position.x, centro[0] + fx, 4, delta);
    s.position.y = THREE.MathUtils.damp(s.position.y, 1.5 + fy, 4, delta);
    // O alvo do spot não está na cena, então a matriz dele é atualizada à mão.
    s.target.position.set(centro[0] + px * 1.2, centro[1], -2);
    s.target.updateMatrixWorld();
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <spotLight
        ref={spot}
        position={[centro[0], 1.5, 6.5]}
        angle={0.55}
        penumbra={1}
        intensity={64}
        decay={2}
        color="#fffaf0"
        castShadow={sombras}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[centro[0] - 5, 1, -3]} intensity={0.35} color="#ffffff" />
    </>
  );
}
