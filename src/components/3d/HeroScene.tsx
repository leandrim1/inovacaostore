import { useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ProductScene } from "./ProductScene";
import { FloatingProduct, HaloRing } from "./FloatingProduct";
import { LuzesDinamicas } from "./Lighting";
import { Particles } from "./Particles";
import { CameraController } from "./CameraController";
import { useQualidade, type Entradas, type ProdutoVitrine } from "./qualidade";

/**
 * Cena do hero da home — módulo carregado sob demanda (é o que puxa
 * three/R3F/drei para a página inicial).
 *
 * - "vertical" (celular, primeiro): UM produto no centro do palco, pendurado
 *   no cabide, que o dedo gira (com inércia e limite) e o giroscópio inclina;
 *   câmera e luz acompanham.
 * - "leque" (computador, expansão): até três produtos em leque na metade
 *   direita, acompanhando o mouse, com sombras reais numa parede invisível.
 */
interface Props {
  layout: "vertical" | "leque";
  produtos: ProdutoVitrine[];
  nivel: "alto" | "medio";
  ativo: boolean;
  eventSource?: RefObject<HTMLElement | null>;
  rolagem: RefObject<number>;
  entradas: Entradas;
  flutuar: boolean;
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
  rolagem,
  entradas,
  flutuar,
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
      camera={vertical ? { position: [0, 0.1, 6.6], fov: 32 } : { position: [0, 0, 10], fov: 32 }}
      onPronto={vertical ? undefined : onPronto}
    >
      {vertical ? (
        produtos[0] && (
          <CenaVertical
            produto={produtos[0]}
            entradas={entradas}
            rolagem={rolagem}
            flutuar={flutuar}
            crescer={crescer}
            onPronto={onPronto}
          />
        )
      ) : (
        <CenaLeque produtos={produtos} entradas={entradas} rolagem={rolagem} flutuar={flutuar} onEscolher={onEscolher} />
      )}
    </ProductScene>
  );
}

function CenaVertical({
  produto,
  entradas,
  rolagem,
  flutuar,
  crescer,
  onPronto,
}: {
  produto: ProdutoVitrine;
  entradas: Entradas;
  rolagem: RefObject<number>;
  flutuar: boolean;
  crescer: boolean;
  onPronto: () => void;
}) {
  return (
    <>
      <LuzesDinamicas entradas={entradas} centro={[0, 0.1]} />
      <CameraController entradas={entradas} base={[0, 0.1, 6.6]} alvo={[0, 0.1, 0]} rolagem={rolagem} />
      <group position={[0, 0.25, -2.2]}>
        <HaloRing raio={1.85} />
      </group>
      {/* `key`: trocar de produto remonta o objeto, que entra crescendo. */}
      <FloatingProduct
        key={produto.id}
        produto={produto}
        entradas={entradas}
        cabide
        sombraNoChao
        flutuar={flutuar}
        crescer={crescer}
        onCarregado={onPronto}
      />
      <Particles entradas={entradas} densidade={0.7} />
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
  rolagem,
  flutuar,
  onEscolher,
}: {
  produtos: ProdutoVitrine[];
  entradas: Entradas;
  rolagem: RefObject<number>;
  flutuar: boolean;
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
    const t = state.clock.elapsedTime;
    const p = rolagem.current ?? 0;
    // Mouse inclina a vitrine inteira e ela balança sozinha bem de leve.
    const alvoY = state.pointer.x * 0.3 + (flutuar ? Math.sin(t * 0.25) * 0.06 : 0);
    const alvoX = -state.pointer.y * 0.14 + p * 0.5;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, alvoY, 3.2, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, alvoX, 3.2, delta);
    // Ao rolar, a vitrine sobe e recua — a transição de profundidade para a
    // seção seguinte.
    g.position.y = THREE.MathUtils.damp(g.position.y, centroY + p * 2.4, 6, delta);
    g.position.z = THREE.MathUtils.damp(g.position.z, -p * 3, 6, delta);
  });

  return (
    <>
      <LuzesDinamicas entradas={{ ...entradas, ponteiro: true }} centro={[centroX, centroY]} sombras={!economico} />
      <group ref={grupo} position={[centroX, centroY, 0]} scale={escala}>
        <group position={[0.1, 0.25, -2.2]}>
          <HaloRing />
        </group>
        {itens.map((produto, i) => (
          <group key={produto.id} position={[leque[i].x, leque[i].y, leque[i].z]} scale={leque[i].escala}>
            <FloatingProduct
              produto={produto}
              giroBase={leque[i].giro}
              ordem={i}
              cabide={i === (itens.length >= 2 ? 1 : 0)}
              rotulo
              interativo
              flutuar={flutuar}
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
      <Particles entradas={entradas} />
    </>
  );
}
