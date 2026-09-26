import { useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ProductScene } from "./ProductScene";
import { FloatingProduct } from "./FloatingProduct";
import { LuzesDinamicas } from "./Lighting";
import { CameraController } from "./CameraController";
import { useQualidade, type Entradas, type ProdutoVitrine } from "./qualidade";

/**
 * Cena do hero da home — módulo carregado sob demanda (é o que puxa
 * three/R3F/drei para a página inicial).
 *
 * - "vertical" (celular, primeiro): UM produto no centro do palco, pendurado
 *   no cabide, que o dedo gira (com inércia e limite) para ver as costas e o
 *   giroscópio inclina de leve; câmera e luz acompanham.
 * - "leque" (computador, expansão): até três produtos em leque na metade
 *   direita; o mouse traz o painel apontado para frente (e mostra nome e
 *   preço), com sombras reais numa parede invisível.
 *
 * Só o produto, o cabide, a luz e a sombra: nada gira ou brilha sozinho.
 */
interface Props {
  layout: "vertical" | "leque";
  produtos: ProdutoVitrine[];
  nivel: "alto" | "medio";
  ativo: boolean;
  eventSource?: RefObject<HTMLElement | null>;
  entradas: Entradas;
  crescer: boolean;
  onEscolher: (slug: string) => void;
  onPronto: () => void;
}

export default function HeroScene({
  layout,
  produtos,
  nivel,
  ativo,
  eventSource,
  entradas,
  crescer,
  onEscolher,
  onPronto,
}: Props) {
  const vertical = layout === "vertical";
  return (
    <ProductScene
      nivel={nivel}
      ativo={ativo}
      eventSource={eventSource}
      sombras={!vertical}
      camera={vertical ? { position: [0, 0.3, 5.7], fov: 32 } : { position: [0, 0, 10], fov: 32 }}
      onPronto={vertical ? undefined : onPronto}
    >
      {vertical ? (
        produtos[0] && (
          <CenaVertical produto={produtos[0]} entradas={entradas} crescer={crescer} onPronto={onPronto} />
        )
      ) : (
        <CenaLeque produtos={produtos} entradas={entradas} onEscolher={onEscolher} />
      )}
    </ProductScene>
  );
}

function CenaVertical({
  produto,
  entradas,
  crescer,
  onPronto,
}: {
  produto: ProdutoVitrine;
  entradas: Entradas;
  crescer: boolean;
  onPronto: () => void;
}) {
  return (
    <>
      <LuzesDinamicas entradas={entradas} centro={[0, 0.3]} />
      {/* Enquadrada no conjunto cabide + peça: ocupa quase toda a altura do palco. */}
      <CameraController entradas={entradas} base={[0, 0.3, 5.7]} alvo={[0, 0.3, 0]} />
      {/* `key`: trocar de produto remonta o objeto, que entra crescendo. */}
      <FloatingProduct
        key={produto.id}
        produto={produto}
        entradas={entradas}
        cabide
        sombraNoChao
        crescer={crescer}
        onCarregado={onPronto}
      />
    </>
  );
}

/** Pose de cada painel no leque, do fundo-esquerda ao fundo-direita. */
function poses(qtd: number) {
  if (qtd <= 1) return [{ x: 0, y: 0.05, z: 0.2, giro: -0.12, escala: 1.05 }];
  if (qtd === 2) {
    return [
      { x: -0.95, y: -0.05, z: -0.4, giro: 0.3, escala: 0.95 },
      { x: 0.95, y: 0.1, z: 0.1, giro: -0.3, escala: 1 },
    ];
  }
  return [
    { x: -1.62, y: -0.18, z: -0.95, giro: 0.44, escala: 0.86 },
    { x: 0, y: 0.08, z: 0.2, giro: 0, escala: 1 },
    { x: 1.62, y: -0.24, z: -0.75, giro: -0.44, escala: 0.86 },
  ];
}

function CenaLeque({
  produtos,
  entradas,
  onEscolher,
}: {
  produtos: ProdutoVitrine[];
  entradas: Entradas;
  onEscolher: (slug: string) => void;
}) {
  const grupo = useRef<THREE.Group>(null);
  const viewport = useThree((s) => s.viewport);
  const { economico } = useQualidade();

  // O leque mora na metade direita, onde o texto do hero não chega. Em telas
  // mais estreitas ele encolhe em vez de invadir o título.
  const escala = THREE.MathUtils.clamp(viewport.width / 11.5, 0.6, 1);
  const centroX = viewport.width / 2 - 2.75 * escala;
  const centroY = -0.1 * escala;
  const itens = produtos.slice(0, 3);
  const leque = poses(itens.length);

  useFrame((state, delta) => {
    const g = grupo.current;
    if (!g) return;
    // O mouse inclina a vitrine um pouco — o suficiente para a luz e a sombra
    // responderem. Parado, ela fica parada.
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, state.pointer.x * 0.22, 3.2, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.1, 3.2, delta);
  });

  return (
    <>
      <LuzesDinamicas entradas={{ ...entradas, ponteiro: true }} centro={[centroX, centroY]} sombras={!economico} />
      <group ref={grupo} position={[centroX, centroY, 0]} scale={escala}>
        {itens.map((produto, i) => (
          <group key={produto.id} position={[leque[i].x, leque[i].y, leque[i].z]} scale={leque[i].escala}>
            <FloatingProduct
              produto={produto}
              giroBase={leque[i].giro}
              ordem={i}
              cabide={i === (itens.length >= 2 ? 1 : 0)}
              rotulo
              interativo
              onEscolher={onEscolher}
            />
          </group>
        ))}
      </group>

      {/* Parede invisível que só recebe sombra: é onde os painéis projetam a
          sombra que anda junto com o spot do mouse. */}
      {!economico && (
        <mesh position={[0, 0, -3.4]} receiveShadow>
          <planeGeometry args={[40, 24]} />
          <shadowMaterial transparent opacity={0.28} />
        </mesh>
      )}
    </>
  );
}
