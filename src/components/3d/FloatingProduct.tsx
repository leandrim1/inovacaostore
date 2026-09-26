import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float, Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { retanguloArredondado, texturaRadial, useTexturaDaFoto, useTexturaEtiqueta } from "./texturas";
import { useQualidade, type Entradas, type ProdutoVitrine } from "./qualidade";

/**
 * O produto como objeto físico: uma placa de vidro com a foto na frente e,
 * no verso, a segunda foto (costas da peça) ou uma etiqueta da loja. Pende de
 * um cabide dourado, flutua, projeta uma sombra macia no "chão" e gira com o
 * arrasto do dedo / mouse e com a inclinação do celular.
 *
 * Não há modelo GLB de roupa: o volume vem da espessura do vidro, da luz
 * que corre na borda e da sombra — e é isso que mantém a cena leve o bastante
 * para um celular intermediário.
 */
export const LARGURA = 1.6;
export const ALTURA = 2;
const AMARELO = "#f5c400";

interface Props {
  produto: ProdutoVitrine;
  entradas?: Entradas;
  /** Giro de repouso em Y (a pose no leque do computador). */
  giroBase?: number;
  cabide?: boolean;
  /** Sombra falsa no chão (celular e visualizador; o computador usa sombra real). */
  sombraNoChao?: boolean;
  /** Mostra nome e preço sob o produto enquanto estiver em foco. */
  rotulo?: boolean;
  /** Flutuação automática (desligada com "reduzir movimento"). */
  flutuar?: boolean;
  /** Ordem de entrada (os painéis aparecem em sequência). */
  ordem?: number;
  onEscolher?: (slug: string) => void;
  /** Recebe o foco de ponteiro (computador): o painel vem para frente. */
  interativo?: boolean;
  /** Entra crescendo (padrão) ou já no tamanho final, para trocar com a versão em CSS sem salto. */
  crescer?: boolean;
  /** A foto da frente virou textura: o produto está pronto para aparecer. */
  onCarregado?: () => void;
}

export function FloatingProduct({
  produto,
  entradas,
  giroBase = 0,
  cabide = false,
  sombraNoChao = false,
  rotulo = false,
  flutuar = true,
  ordem = 0,
  onEscolher,
  interativo = false,
  crescer = true,
  onCarregado,
}: Props) {
  const { economico } = useQualidade();
  const raiz = useRef<THREE.Group>(null);
  const peca = useRef<THREE.Group>(null);
  const sombra = useRef<THREE.Mesh>(null);
  const [emFoco, setEmFoco] = useState(false);
  const aparicao = useRef(crescer ? 0 : 1);

  const frente = useTexturaDaFoto(produto.imagem, produto.focoX, produto.focoY);
  const segunda = useTexturaDaFoto(produto.verso, 50, 50);
  const etiqueta = useTexturaEtiqueta(produto.nome, produto.preco, !produto.verso);
  const verso = segunda ?? etiqueta;

  useEffect(() => {
    if (frente) onCarregado?.();
    // Só a chegada da textura importa; a função pode mudar a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frente]);

  const foto = useMemo(() => retanguloArredondado(LARGURA, ALTURA, 0.09), []);
  const texSombra = useMemo(() => texturaRadial(0.85, 0.4), []);
  useEffect(
    () => () => {
      foto.dispose();
      texSombra.dispose();
    },
    [foto, texSombra],
  );

  useFrame((_, delta) => {
    const r = raiz.current;
    const p = peca.current;
    if (!r || !p) return;
    // Entra crescendo quando a foto termina de carregar (em sequência no leque).
    aparicao.current = frente ? THREE.MathUtils.damp(aparicao.current, 1, 2.4 - ordem * 0.35, delta) : crescer ? 0 : aparicao.current;
    const s = Math.max(0.001, aparicao.current) * (emFoco ? 1.07 : 1);
    r.scale.setScalar(THREE.MathUtils.damp(r.scale.x, s, 8, delta));

    const giro = entradas?.rotacao?.get() ?? 0;
    const gx = entradas?.giroX?.get() ?? 0;
    const gy = entradas?.giroY?.get() ?? 0;
    const alvoY = (emFoco ? giroBase * 0.2 : giroBase) + giro + gx * 0.22;
    const alvoX = -gy * 0.12;
    // Rotação amortecida: segue o dedo com um leve atraso (peso).
    p.rotation.y = THREE.MathUtils.damp(p.rotation.y, alvoY, 9, delta);
    p.rotation.x = THREE.MathUtils.damp(p.rotation.x, alvoX, 6, delta);
    p.position.z = THREE.MathUtils.damp(p.position.z, emFoco ? 0.7 : 0, 6, delta);

    const m = sombra.current;
    if (m) {
      // A sombra estreita quando a placa vira de lado e acompanha a flutuação.
      const largura = 0.55 + Math.abs(Math.cos(p.rotation.y)) * 0.45;
      m.scale.set(LARGURA * 1.5 * largura, 0.55, 1);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.55 * aparicao.current;
    }
  });

  function clicar(e: ThreeEvent<MouseEvent>) {
    // Clique que caiu num botão ou link sobreposto (CTA, indicadores) é deles.
    if ((e.nativeEvent.target as Element | null)?.closest?.("a,button")) return;
    e.stopPropagation();
    onEscolher?.(produto.slug);
  }

  function entrar(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    setEmFoco(true);
    const alvo = e.nativeEvent.currentTarget as HTMLElement | null;
    if (alvo) alvo.style.cursor = "pointer";
  }

  function sair(e: ThreeEvent<PointerEvent>) {
    setEmFoco(false);
    const alvo = e.nativeEvent.currentTarget as HTMLElement | null;
    if (alvo) alvo.style.cursor = "";
  }

  const conteudo = (
    <group
      ref={peca}
      rotation-y={giroBase}
      onClick={interativo ? clicar : undefined}
      onPointerOver={interativo ? entrar : undefined}
      onPointerOut={interativo ? sair : undefined}
    >
      <RoundedBox args={[LARGURA + 0.16, ALTURA + 0.16, 0.09]} radius={0.12} smoothness={economico ? 2 : 4} castShadow={!economico && !sombraNoChao}>
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.15}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          opacity={0.38}
          envMapIntensity={1.6}
        />
      </RoundedBox>
      {frente && (
        <mesh geometry={foto} position-z={0.047}>
          <meshStandardMaterial
            map={frente}
            emissiveMap={frente}
            emissive="#ffffff"
            emissiveIntensity={0.72}
            roughness={0.42}
            metalness={0.05}
            envMapIntensity={0.35}
            toneMapped={false}
          />
        </mesh>
      )}
      {verso && (
        <mesh geometry={foto} position-z={-0.047} rotation-y={Math.PI}>
          <meshStandardMaterial
            map={verso}
            emissiveMap={verso}
            emissive="#ffffff"
            emissiveIntensity={0.7}
            roughness={0.45}
            toneMapped={false}
          />
        </mesh>
      )}
      {cabide && <Cabide economico={economico} />}
      {/* Filete amarelo na base, como a etiqueta de preço de uma vitrine. */}
      <mesh position={[0, -ALTURA / 2 - 0.02, 0.05]}>
        <boxGeometry args={[LARGURA * 0.36, 0.022, 0.02]} />
        <meshBasicMaterial color={AMARELO} toneMapped={false} />
      </mesh>
      {rotulo && emFoco && (
        <Html position={[0, -ALTURA / 2 - 0.34, 0.1]} center zIndexRange={[20, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/15 bg-black/65 px-4 py-1.5 text-center shadow-2xl backdrop-blur-md">
            <p className="font-display text-xs tracking-[0.18em] text-white">{produto.nome}</p>
            <p className="text-[11px] font-semibold text-brand-yellow">{produto.preco}</p>
          </div>
        </Html>
      )}
    </group>
  );

  return (
    <group ref={raiz} scale={crescer ? 0.001 : 1}>
      {flutuar ? (
        <Float speed={1.3 + ordem * 0.2} rotationIntensity={0.16} floatIntensity={0.45} floatingRange={[-0.07, 0.07]}>
          {conteudo}
        </Float>
      ) : (
        conteudo
      )}
      {sombraNoChao && (
        <mesh ref={sombra} position={[0, -ALTURA / 2 - 0.55, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry />
          <meshBasicMaterial map={texSombra} color="#000000" transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Cabide de metal amarelo de onde o produto pende — o detalhe que diz "loja
 * de roupa" sem baixar modelo nenhum: um tubo passando por uma curva
 * desenhada à mão (gancho, ombros e barra).
 */
function Cabide({ economico }: { economico: boolean }) {
  const geometria = useMemo(() => {
    const pontos = [
      [-0.16, 0.84], [-0.12, 0.96], [0, 1.0], [0.12, 0.95], [0.12, 0.8], [0.02, 0.68], [0, 0.56],
      [-0.3, 0.4], [-0.98, 0.02], [-1.0, -0.08], [-0.85, -0.1], [0, -0.1], [0.85, -0.1],
      [1.0, -0.08], [0.98, 0.02], [0.3, 0.4], [0.02, 0.555],
    ].map(([x, y]) => new THREE.Vector3(x, y, 0));
    const curva = new THREE.CatmullRomCurve3(pontos, false, "centripetal");
    return new THREE.TubeGeometry(curva, economico ? 120 : 220, 0.03, economico ? 8 : 12, false);
  }, [economico]);
  useEffect(() => () => geometria.dispose(), [geometria]);

  // A barra (y = -0.1 na curva) encosta na borda de cima da placa de vidro.
  const escala = 0.56;
  return (
    <mesh geometry={geometria} position={[0, ALTURA / 2 + 0.08 + 0.1 * escala, -0.05]} scale={escala} castShadow={!economico}>
      <meshStandardMaterial color={AMARELO} metalness={0.95} roughness={0.22} envMapIntensity={1.4} />
    </mesh>
  );
}

/** Anel fino e luminoso atrás do produto, com um halo aditivo por trás. */
export function HaloRing({ raio = 2.3 }: { raio?: number }) {
  const ref = useRef<THREE.Group>(null);
  const halo = useMemo(() => texturaRadial(1, 0.35), []);
  useEffect(() => () => halo.dispose(), [halo]);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.z = t * 0.08;
    g.rotation.y = -0.45 + Math.sin(t * 0.3) * 0.12;
  });

  return (
    <group ref={ref}>
      <mesh>
        <torusGeometry args={[raio, 0.012, 12, 180]} />
        <meshBasicMaterial color={AMARELO} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <mesh rotation-x={0.35} scale={0.82}>
        <torusGeometry args={[raio, 0.006, 8, 160]} />
        <meshBasicMaterial color="#ffe066" transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <mesh position-z={-0.3} scale={raio * 3.2}>
        <planeGeometry />
        <meshBasicMaterial
          map={halo}
          color={AMARELO}
          transparent
          opacity={0.32}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
