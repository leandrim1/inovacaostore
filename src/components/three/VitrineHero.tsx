import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Float, Html, PerformanceMonitor, RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";

/**
 * Vitrine 3D do hero: as peças em destaque flutuam em painéis de vidro sobre
 * a foto do hero, com um anel de luz amarelo ao fundo, poeira luminosa e um
 * spot que acompanha o mouse — a luz e as sombras dos painéis andam com ele.
 *
 * Este módulo é o único que importa three/R3F/drei e só é baixado sob demanda
 * (ver `VitrineHero3D`): celular, "menos movimento" e aparelho fraco nunca o
 * recebem.
 *
 * Custos pensados para notebook intermediário:
 * - nada de HDR, modelos ou fontes externas (a CSP da Vercel só permite a
 *   própria origem): o reflexo vem de um estúdio de planos de luz gerado uma
 *   única vez no próprio navegador;
 * - as fotos são redimensionadas num canvas antes de virar textura;
 * - fora da tela o laço de render para (`frameloop="never"`), e o monitor de
 *   desempenho derruba resolução, sombras e partículas se o FPS cair.
 */

export interface ProdutoVitrine {
  id: string;
  slug: string;
  nome: string;
  preco: string;
  imagem: string;
  /** Ponto de interesse da foto (0–100), vindo do enquadramento do painel. */
  focoX: number;
  focoY: number;
}

interface VitrineHeroProps {
  produtos: ProdutoVitrine[];
  nivel: "lite" | "full";
  /** Elemento que recebe o ponteiro — o canvas fica por baixo do texto e não captura nada. */
  eventSource: RefObject<HTMLElement | null>;
  /** 0 com o hero inteiro na tela, 1 quando ele já saiu por cima. */
  rolagem: RefObject<number>;
  ativo: boolean;
  onEscolher: (slug: string) => void;
  onPronto: () => void;
  onFalha: () => void;
}

const AMARELO = "#f5c400";
const LARGURA = 1.6;
const ALTURA = 2;

export default function VitrineHero({
  produtos,
  nivel,
  eventSource,
  rolagem,
  ativo,
  onEscolher,
  onPronto,
  onFalha,
}: VitrineHeroProps) {
  const [dprMax, setDprMax] = useState(nivel === "full" ? 1.75 : 1.25);
  const [economico, setEconomico] = useState(nivel === "lite");

  return (
    <Canvas
      dpr={[1, dprMax]}
      frameloop={ativo ? "always" : "never"}
      shadows={economico ? false : "percentage"}
      camera={{ position: [0, 0, 10], fov: 32, near: 0.1, far: 40 }}
      gl={{ antialias: nivel === "full", alpha: true, powerPreference: "high-performance", stencil: false }}
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFalha();
        });
        requestAnimationFrame(() => onPronto());
      }}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDprMax(1);
          setEconomico(true);
        }}
      />
      <EstudioDeLuz />
      <Cena produtos={produtos} economico={economico} rolagem={rolagem} onEscolher={onEscolher} />
    </Canvas>
  );
}

/**
 * Mapa de reflexo feito na hora: alguns planos luminosos (um softbox em cima,
 * um rebatedor amarelo na lateral, um preenchimento à direita) renderizados
 * uma vez para um PMREM. Faz o vidro e o metal refletirem luz de estúdio sem
 * baixar arquivo nenhum.
 */
function EstudioDeLuz() {
  const get = useThree((s) => s.get);

  useEffect(() => {
    // Lidos do estado do R3F dentro do efeito: a cena é um objeto do Three,
    // não um valor do React, e é aqui que ela recebe o mapa de reflexo.
    const { gl, scene } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const estudio = new THREE.Scene();
    const plano = new THREE.PlaneGeometry(1, 1);
    const luz = (cor: string, forca: number, pos: [number, number, number], escala: [number, number]) => {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(cor).multiplyScalar(forca),
        side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(plano, material);
      m.position.set(...pos);
      m.scale.set(escala[0], escala[1], 1);
      m.lookAt(0, 0, 0);
      estudio.add(m);
    };
    luz("#ffffff", 3.2, [0, 6, 2], [12, 3]);
    luz(AMARELO, 2.6, [-7, 0.5, 0], [3, 9]);
    luz("#ffffff", 1.6, [7, 1, 4], [3, 6]);
    luz("#fff3c4", 0.5, [0, -1, -9], [18, 6]);

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

/** Posição de cada painel no leque, do fundo-esquerda ao fundo-direita. */
interface Pose {
  x: number;
  y: number;
  z: number;
  giro: number;
  escala: number;
}

function poses(qtd: number): Pose[] {
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

interface CenaProps {
  produtos: ProdutoVitrine[];
  economico: boolean;
  rolagem: RefObject<number>;
  onEscolher: (slug: string) => void;
}

function Cena({ produtos, economico, rolagem, onEscolher }: CenaProps) {
  const grupo = useRef<THREE.Group>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const anel = useRef<THREE.Group>(null);
  const viewport = useThree((s) => s.viewport);

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

    // Mouse inclina a vitrine inteira; sem mouse (tablet) ela balança sozinha.
    const alvoY = state.pointer.x * 0.3 + Math.sin(t * 0.25) * 0.06;
    const alvoX = -state.pointer.y * 0.14 + p * 0.5;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, alvoY, 3.2, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, alvoX, 3.2, delta);
    // Ao rolar, a vitrine sobe e recua — a transição de profundidade para a
    // seção seguinte.
    g.position.y = THREE.MathUtils.damp(g.position.y, centroY + p * 2.4, 6, delta);
    g.position.z = THREE.MathUtils.damp(g.position.z, -p * 3, 6, delta);

    if (spot.current) {
      const s = spot.current;
      s.position.x = THREE.MathUtils.damp(s.position.x, centroX + state.pointer.x * 4.5, 4, delta);
      s.position.y = THREE.MathUtils.damp(s.position.y, 1.5 + state.pointer.y * 3, 4, delta);
      // O alvo do spot não está na cena, então a matriz dele é atualizada à mão.
      s.target.position.set(centroX + state.pointer.x * 1.2, centroY, -2);
      s.target.updateMatrixWorld();
    }
    if (anel.current) {
      anel.current.rotation.z = t * 0.08;
      anel.current.rotation.y = -0.45 + Math.sin(t * 0.3) * 0.12;
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <spotLight
        ref={spot}
        position={[centroX, 1.5, 6.5]}
        angle={0.55}
        penumbra={1}
        intensity={70}
        decay={2}
        color="#fff6dc"
        castShadow={!economico}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <pointLight position={[centroX - 4, -2.5, -2]} intensity={30} color={AMARELO} decay={2} />

      <group ref={grupo} position={[centroX, centroY, 0]} scale={escala}>
        <group ref={anel} position={[0.1, 0.25, -2.2]}>
          <AnelDeLuz />
        </group>
        {itens.map((produto, i) => (
          <Painel
            key={produto.id}
            produto={produto}
            pose={leque[i]}
            ordem={i}
            economico={economico}
            cabide={i === (itens.length >= 2 ? 1 : 0)}
            onEscolher={onEscolher}
          />
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

      <Sparkles
        count={economico ? 26 : 70}
        scale={[viewport.width * 1.1, viewport.height * 1.1, 5]}
        position={[0, 0, -1]}
        size={economico ? 2.8 : 3.6}
        speed={0.3}
        opacity={0.75}
        noise={0.8}
        color={AMARELO}
      />
    </>
  );
}

/** Anel fino e luminoso atrás do leque, com um halo aditivo por trás. */
function AnelDeLuz() {
  const halo = useMemo(() => texturaHalo(), []);
  useEffect(() => () => halo.dispose(), [halo]);

  return (
    <>
      <mesh>
        <torusGeometry args={[2.3, 0.012, 12, 180]} />
        <meshBasicMaterial color={AMARELO} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <mesh rotation-x={0.35} scale={0.82}>
        <torusGeometry args={[2.3, 0.006, 8, 160]} />
        <meshBasicMaterial color="#ffe066" transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <mesh position-z={-0.3} scale={7.5}>
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
    </>
  );
}

function texturaHalo() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Cabide de metal amarelo de onde o painel da frente "pende" — o detalhe que
 * diz "loja de roupa" sem baixar modelo 3D nenhum: é um tubo passando por uma
 * curva desenhada à mão (gancho, ombros e barra).
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
    <mesh
      geometry={geometria}
      position={[0, ALTURA / 2 + 0.08 + 0.1 * escala, -0.05]}
      scale={escala}
      castShadow={!economico}
    >
      <meshStandardMaterial color={AMARELO} metalness={0.95} roughness={0.22} envMapIntensity={1.4} />
    </mesh>
  );
}

interface PainelProps {
  produto: ProdutoVitrine;
  pose: Pose;
  ordem: number;
  economico: boolean;
  /** O painel da frente pende do cabide. */
  cabide: boolean;
  onEscolher: (slug: string) => void;
}

function Painel({ produto, pose, ordem, economico, cabide, onEscolher }: PainelProps) {
  const ref = useRef<THREE.Group>(null);
  const [emFoco, setEmFoco] = useState(false);
  const textura = useTexturaDaFoto(produto.imagem, produto.focoX, produto.focoY);
  const aparicao = useRef(0);
  const foto = useMemo(() => retanguloArredondado(LARGURA, ALTURA, 0.09), []);
  useEffect(() => () => foto.dispose(), [foto]);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    // Cada painel entra em sequência, crescendo, quando a foto termina de carregar.
    aparicao.current = THREE.MathUtils.damp(aparicao.current, textura ? 1 : 0, 2.2 - ordem * 0.35, delta);
    const s = pose.escala * Math.max(0.001, aparicao.current) * (emFoco ? 1.07 : 1);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 8, delta));
    g.position.z = THREE.MathUtils.damp(g.position.z, pose.z + (emFoco ? 0.7 : 0), 6, delta);
    // Em foco, a peça gira para encarar o visitante.
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, emFoco ? pose.giro * 0.2 : pose.giro, 6, delta);
  });

  function clicar(e: ThreeEvent<MouseEvent>) {
    // Clique que caiu num botão ou link do hero (CTA, indicadores) é deles.
    if ((e.nativeEvent.target as Element | null)?.closest?.("a,button")) return;
    e.stopPropagation();
    onEscolher(produto.slug);
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

  if (!textura) return null;

  return (
    <group ref={ref} position={[pose.x, pose.y, pose.z]} rotation-y={pose.giro} scale={0.001}>
      <Float speed={1.3 + ordem * 0.2} rotationIntensity={0.18} floatIntensity={0.45} floatingRange={[-0.07, 0.07]}>
        <group onClick={clicar} onPointerOver={entrar} onPointerOut={sair}>
          {/* Placa de vidro: borda com reflexo de estúdio em volta da foto. */}
          <RoundedBox args={[LARGURA + 0.16, ALTURA + 0.16, 0.07]} radius={0.12} smoothness={4} castShadow={!economico}>
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
          <mesh geometry={foto} position-z={0.04}>
            <meshStandardMaterial
              map={textura}
              emissiveMap={textura}
              emissive="#ffffff"
              emissiveIntensity={0.72}
              roughness={0.42}
              metalness={0.05}
              envMapIntensity={0.35}
              toneMapped={false}
            />
          </mesh>
          {cabide && <Cabide economico={economico} />}
          {/* Filete amarelo na base, como a etiqueta de preço de uma vitrine. */}
          <mesh position={[0, -ALTURA / 2 - 0.02, 0.05]}>
            <boxGeometry args={[LARGURA * 0.36, 0.022, 0.02]} />
            <meshBasicMaterial color={AMARELO} toneMapped={false} />
          </mesh>
          {emFoco && (
            <Html position={[0, -ALTURA / 2 - 0.34, 0.1]} center zIndexRange={[20, 0]}>
              <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/15 bg-black/65 px-4 py-1.5 text-center shadow-2xl backdrop-blur-md">
                <p className="font-display text-xs tracking-[0.18em] text-white">{produto.nome}</p>
                <p className="text-[11px] font-semibold text-brand-yellow">{produto.preco}</p>
              </div>
            </Html>
          )}
        </group>
      </Float>
    </group>
  );
}

/**
 * Carrega a foto do produto e recorta em 4:5 num canvas (respeitando o ponto
 * de interesse salvo no painel) antes de mandar para a GPU — uma foto de
 * 2000 px vira uma textura de 600×750, o suficiente para o tamanho do painel.
 * Se a imagem não puder ser usada pelo WebGL (servidor sem CORS, 404), o
 * painel simplesmente não aparece; o resto da cena continua.
 */
function useTexturaDaFoto(url: string, focoX: number, focoY: number) {
  const gl = useThree((s) => s.gl);
  const [textura, setTextura] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let vivo = true;
    let criada: THREE.Texture | null = null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      if (!vivo || !img.naturalWidth) return;
      const L = 600;
      const A = 750;
      const canvas = document.createElement("canvas");
      canvas.width = L;
      canvas.height = A;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const escala = Math.max(L / img.naturalWidth, A / img.naturalHeight);
      const w = img.naturalWidth * escala;
      const h = img.naturalHeight * escala;
      ctx.drawImage(img, (L - w) * (focoX / 100), (A - h) * (focoY / 100), w, h);
      criada = new THREE.CanvasTexture(canvas);
      criada.colorSpace = THREE.SRGBColorSpace;
      criada.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
      setTextura(criada);
    };
    img.src = url;
    return () => {
      vivo = false;
      img.onload = null;
      criada?.dispose();
    };
  }, [url, focoX, focoY, gl]);

  return textura;
}

/** Plano de cantos arredondados com UV de 0 a 1 (o `ShapeGeometry` usa as coordenadas da forma). */
function retanguloArredondado(l: number, a: number, r: number) {
  const x = -l / 2;
  const y = -a / 2;
  const forma = new THREE.Shape();
  forma.moveTo(x + r, y);
  forma.lineTo(x + l - r, y);
  forma.quadraticCurveTo(x + l, y, x + l, y + r);
  forma.lineTo(x + l, y + a - r);
  forma.quadraticCurveTo(x + l, y + a, x + l - r, y + a);
  forma.lineTo(x + r, y + a);
  forma.quadraticCurveTo(x, y + a, x, y + a - r);
  forma.lineTo(x, y + r);
  forma.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ShapeGeometry(forma, 8);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - x) / l, (pos.getY(i) - y) / a);
  return geo;
}
