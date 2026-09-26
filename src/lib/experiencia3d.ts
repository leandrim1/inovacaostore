import { useSyncExternalStore } from "react";

/**
 * Quanto de 3D este aparelho aguenta — decidido num lugar só, para a cena
 * WebGL, os cards, o carrossel e as transições nunca discordarem entre si.
 *
 * O ponto de partida é o celular (a loja é mobile first); o computador é uma
 * expansão do mesmo sistema.
 *
 * - `nivel`
 *   - "alto": cena WebGL completa — partículas, sombras reais (no computador),
 *     resolução cheia. Celular topo de linha e computador com folga.
 *   - "medio": a mesma cena reduzida — menos partículas, sem sombras reais,
 *     resolução contida. Celular intermediário e iPhone.
 *   - "baixo": sem WebGL. O produto 3D vira camadas em CSS (perspectiva,
 *     arrasto, giroscópio) e nada de Three.js é baixado. Aparelho fraco,
 *     economia de dados, navegador sem WebGL, "reduzir movimento", ou quando a
 *     cena não aguentou o FPS em tempo real.
 * - `toque`: o aparelho não tem mouse de verdade. Nenhuma função depende de
 *   hover: tudo que o mouse faz passando por cima, o toque faz tocando.
 * - `inclinacao`: cards que acompanham o ponteiro (só com mouse).
 * - `profundidade`: entradas e transições com perspectiva (CSS).
 * - `reduzido`: `prefers-reduced-motion` — sem rotação automática, sem
 *   partículas, sem giroscópio, só as transições essenciais.
 */
export type Nivel3D = "alto" | "medio" | "baixo";

export interface Experiencia3D {
  nivel: Nivel3D;
  webgl: boolean;
  toque: boolean;
  inclinacao: boolean;
  profundidade: boolean;
  reduzido: boolean;
}

const PADRAO_SERVIDOR: Experiencia3D = {
  nivel: "baixo",
  webgl: false,
  toque: false,
  inclinacao: false,
  profundidade: false,
  reduzido: true,
};

const CONSULTAS = {
  menosMovimento: "(prefers-reduced-motion: reduce)",
  mouse: "(hover: hover) and (pointer: fine)",
} as const;

interface NavegadorComExtras extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

let suportaWebGL: boolean | null = null;

/** Testado uma vez só: criar contexto WebGL custa, e a resposta não muda. */
function temWebGL(): boolean {
  if (suportaWebGL !== null) return suportaWebGL;
  try {
    const canvas = document.createElement("canvas");
    // `failIfMajorPerformanceCaveat`: recusa renderização por software (sem
    // GPU), onde a cena travaria a rolagem em vez de enfeitar.
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ??
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    suportaWebGL = Boolean(gl);
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    suportaWebGL = false;
  }
  return suportaWebGL;
}

function casa(consulta: string) {
  return window.matchMedia(consulta).matches;
}

function ehIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * `localStorage["inovacao:3d"] = "alto" | "medio" | "baixo"` força um nível
 * (para conferir a cena num aparelho que cairia em outro, ou desligá-la de
 * vez). Só troca o que é desenhado; nada de dados passa por aqui.
 */
function nivelForcado(): Nivel3D | null {
  try {
    const valor = window.localStorage.getItem("inovacao:3d");
    const legado: Record<string, Nivel3D> = { full: "alto", lite: "medio", off: "baixo" };
    if (valor === "alto" || valor === "medio" || valor === "baixo") return valor;
    return valor && legado[valor] ? legado[valor] : null;
  } catch {
    return null;
  }
}

/** Rebaixado em tempo real (FPS que não se sustentou, contexto WebGL perdido). Vale até recarregar. */
let tetoDaSessao: Nivel3D | null = null;

const ORDEM: Nivel3D[] = ["baixo", "medio", "alto"];

function nivelDoHardware(mouse: boolean): Nivel3D {
  const nav = navigator as NavegadorComExtras;
  if (nav.connection?.saveData) return "baixo";
  if (!temWebGL()) return "baixo";

  const nucleos = nav.hardwareConcurrency ?? 4;
  // Safari não informa memória; sem a informação, supõe-se um aparelho médio.
  const memoria = nav.deviceMemory ?? 4;

  if (mouse) return nucleos > 4 && memoria > 4 ? "alto" : "medio";
  if (ehIOS()) return "medio";
  if (nucleos <= 4 || memoria <= 2) return "baixo";
  return nucleos >= 8 && memoria >= 6 ? "alto" : "medio";
}

function calcular(): Experiencia3D {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return PADRAO_SERVIDOR;
  const reduzido = casa(CONSULTAS.menosMovimento);
  const mouse = casa(CONSULTAS.mouse);

  let nivel: Nivel3D = reduzido ? "baixo" : (nivelForcado() ?? nivelDoHardware(mouse));
  if (tetoDaSessao && ORDEM.indexOf(nivel) > ORDEM.indexOf(tetoDaSessao)) nivel = tetoDaSessao;

  return {
    nivel,
    webgl: nivel !== "baixo",
    toque: !mouse,
    inclinacao: mouse && !reduzido,
    profundidade: !reduzido,
    reduzido,
  };
}

let atual: Experiencia3D | null = null;
const ouvintes = new Set<() => void>();
let desinscrever: (() => void) | null = null;

function lerSnapshot(): Experiencia3D {
  if (atual === null) atual = calcular();
  return atual;
}

function aoMudar() {
  const novo = calcular();
  const antigo = atual;
  if (antigo && (Object.keys(novo) as (keyof Experiencia3D)[]).every((k) => antigo[k] === novo[k])) return;
  atual = novo;
  ouvintes.forEach((ouvir) => ouvir());
}

/** Um único conjunto de ouvintes de mídia para a página inteira, não um por card. */
function inscrever(ouvir: () => void) {
  ouvintes.add(ouvir);
  if (!desinscrever && typeof window !== "undefined" && typeof window.matchMedia === "function") {
    const listas = Object.values(CONSULTAS).map((q) => window.matchMedia(q));
    listas.forEach((mql) => mql.addEventListener("change", aoMudar));
    desinscrever = () => listas.forEach((mql) => mql.removeEventListener("change", aoMudar));
  }
  return () => {
    ouvintes.delete(ouvir);
    if (ouvintes.size === 0 && desinscrever) {
      desinscrever();
      desinscrever = null;
    }
  };
}

export function useExperiencia3D(): Experiencia3D {
  return useSyncExternalStore(inscrever, lerSnapshot, () => PADRAO_SERVIDOR);
}

/**
 * A cena avisa que não aguentou (FPS caindo mesmo depois de reduzir, ou o
 * navegador derrubou o contexto WebGL): o aparelho passa para um nível abaixo
 * até a página ser recarregada. Nunca sobe por aqui.
 */
export function rebaixarNivel3D(para: Nivel3D) {
  const agora = lerSnapshot().nivel;
  if (ORDEM.indexOf(para) >= ORDEM.indexOf(agora)) return;
  tetoDaSessao = para;
  aoMudar();
}

/**
 * `transformTemplate` do framer-motion que acrescenta perspectiva à rotação —
 * mas só enquanto existe alguma transformação. Parado, o elemento volta a
 * `transform: none`: um `perspective()` esquecido no estilo faria dele o bloco
 * de contenção de qualquer filho `position: fixed` (um modal dentro de um
 * card revelado passaria a ficar preso ao card em vez de cobrir a tela).
 */
export function comPerspectiva(distancia: number) {
  return (_: unknown, gerado: string) =>
    gerado && gerado !== "none" ? `perspective(${distancia}px) ${gerado}` : "none";
}

/**
 * Disparado quando o hero da home monta ou desmonta: o header fica em vidro
 * escuro enquanto está por cima dele e precisa saber quando o hero chegou
 * (a home é carregada sob demanda, depois do header).
 */
export const EVENTO_HERO = "inovacao:hero";
