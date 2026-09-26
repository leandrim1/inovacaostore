import type { RefObject } from "react";
import type { MotionValue } from "framer-motion";
import { ProductScene } from "./ProductScene";
import { FloatingProduct, HaloRing } from "./FloatingProduct";
import { LuzesDinamicas } from "./Lighting";
import { Particles } from "./Particles";
import { CameraController } from "./CameraController";
import type { ProdutoVitrine } from "./qualidade";

/**
 * Cena do "Ver em 3D" da página de produto (carregada sob demanda, só quando
 * o visualizador abre). O produto gira livre com o dedo — a frente é a foto
 * escolhida, as costas a foto seguinte (ou a etiqueta da loja) —, a pinça
 * aproxima a câmera, a luz e a câmera acompanham o giro.
 */
export default function ProductViewer({
  produto,
  nivel,
  rotacao,
  arrastando,
  giroX,
  giroY,
  zoom,
  flutuar,
  onPronto,
}: {
  produto: ProdutoVitrine;
  nivel: "alto" | "medio";
  rotacao: MotionValue<number>;
  arrastando: MotionValue<number>;
  giroX: MotionValue<number>;
  giroY: MotionValue<number>;
  zoom: RefObject<number>;
  flutuar: boolean;
  onPronto: () => void;
}) {
  const entradas = { rotacao, arrastando, giroX, giroY };
  return (
    <ProductScene nivel={nivel} ativo camera={{ position: [0, 0.15, 6.4], fov: 32 }}>
      <LuzesDinamicas entradas={entradas} centro={[0, 0.15]} />
      <CameraController entradas={entradas} base={[0, 0.15, 6.4]} alvo={[0, 0.15, 0]} zoom={zoom} />
      <group position={[0, 0.3, -2.4]}>
        <HaloRing raio={2} />
      </group>
      <FloatingProduct
        key={produto.imagem}
        produto={produto}
        entradas={entradas}
        cabide
        sombraNoChao
        flutuar={flutuar}
        crescer={false}
        onCarregado={onPronto}
      />
      <Particles entradas={entradas} densidade={0.6} />
    </ProductScene>
  );
}
