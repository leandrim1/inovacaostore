import { useSyncExternalStore } from "react";

/**
 * Quanto de 3D este aparelho aguenta — decidido num lugar só, para a vitrine
 * WebGL do hero, a inclinação dos cards e as entradas com profundidade nunca
 * discordarem entre si.
 *
 * - `webgl`: a cena Three.js do hero.
 *   - "off": celular e tablet em pé (abaixo de 1024 px a foto do hero ocupa
 *     o topo e a vitrine cobriria as pessoas), quem pediu menos movimento,
 *     economia de dados, aparelho fraco ou navegador sem WebGL. Nada de
 *     Three.js é baixado.
 *   - "lite": tablet deitado, notebook menor ou processador intermediário — a
 *     mesma cena com menos partículas, sem sombras e resolução contida.
 *   - "full": computador com mouse e folga de hardware.
 * - `inclinacao`: cards que acompanham o ponteiro. Só com mouse de verdade:
 *   no toque não existe "passar por cima", e mexer o card sob o dedo atrapalha.
 * - `profundidade`: entradas e transições com perspectiva (CSS, custo baixo).
 *   Só desliga para quem pediu menos movimento.
 */
export type NivelWebGL = "off" | "lite" | "full";

export interface Experiencia3D {
  webgl: NivelWebGL;
  inclinacao: boolean;
  profundidade: boolean;
}

const DESLIGADO: Experiencia3D = { webgl: "off", inclinacao: false, profundidade: false };

const CONSULTAS = {
  menosMovimento: "(prefers-reduced-motion: reduce)",
  mouse: "(hover: hover) and (pointer: fine)",
  amplo: "(min-width: 1024px)",
  notebook: "(min-width: 1280px)",
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

/**
 * `localStorage["inovacao:3d"] = "off" | "lite" | "full"` força um nível da
 * vitrine WebGL — para conferir a cena num aparelho que cairia em outro nível
 * (ou desligá-la de vez). Só troca o que é desenhado; nada de dados passa por aqui.
 */
function nivelForcado(): NivelWebGL | null {
  try {
    const valor = window.localStorage.getItem("inovacao:3d");
    return valor === "off" || valor === "lite" || valor === "full" ? valor : null;
  } catch {
    return null;
  }
}

function calcular(): Experiencia3D {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return DESLIGADO;
  if (casa(CONSULTAS.menosMovimento)) return DESLIGADO;

  const forcado = nivelForcado();
  if (forcado) return { webgl: forcado, inclinacao: casa(CONSULTAS.mouse), profundidade: true };

  const nav = navigator as NavegadorComExtras;
  const nucleos = nav.hardwareConcurrency ?? 4;
  const memoria = nav.deviceMemory ?? 4;
  const economia = Boolean(nav.connection?.saveData);
  const mouse = casa(CONSULTAS.mouse);

  let webgl: NivelWebGL = "off";
  if (casa(CONSULTAS.amplo) && !economia && nucleos > 2 && memoria > 2 && temWebGL()) {
    webgl = mouse && casa(CONSULTAS.notebook) && nucleos > 4 && memoria > 4 ? "full" : "lite";
  }

  return { webgl, inclinacao: mouse, profundidade: true };
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
  if (
    antigo &&
    antigo.webgl === novo.webgl &&
    antigo.inclinacao === novo.inclinacao &&
    antigo.profundidade === novo.profundidade
  ) {
    return;
  }
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
  return useSyncExternalStore(inscrever, lerSnapshot, () => DESLIGADO);
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
