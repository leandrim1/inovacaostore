import { useEffect, useSyncExternalStore } from "react";
import { motionValue } from "framer-motion";

/**
 * Inclinação do celular (DeviceOrientation) para o parallax sutil da cena 3D,
 * das partículas e dos fundos.
 *
 * Não é "para onde o celular aponta": é quanto ele se inclinou em relação a
 * como a pessoa o segura. A referência acompanha devagar a postura (quem
 * deita no sofá não fica com a cena torta para sempre), então só as
 * inclinações momentâneas movem as camadas — nunca a página "balança".
 *
 * Saída: `inclinacaoX` / `inclinacaoY` entre -1 e 1, já suavizados.
 * Onde não há sensor (computador, navegador sem suporte, permissão negada),
 * os valores ficam em 0 e ninguém precisa tratar o caso.
 *
 * No iPhone o Safari exige permissão, pedida a partir de um toque — por isso
 * existe `pedirPermissao()` e o estado "precisa-permissao".
 */
export const inclinacaoX = motionValue(0);
export const inclinacaoY = motionValue(0);

export type EstadoSensor = "indisponivel" | "aguardando" | "precisa-permissao" | "ativo" | "negado";

interface OrientacaoComPermissao {
  requestPermission?: () => Promise<"granted" | "denied">;
}

const GRAUS_PARA_MAXIMO = 18;
const DERIVA = 0.004;
const SUAVIZACAO = 0.18;

let estado: EstadoSensor = "indisponivel";
let consumidores = 0;
let ouvindo = false;
let base: { x: number; y: number } | null = null;
let suave = { x: 0, y: 0 };
let ultimo: { x: number; y: number } | null = null;
let esperaPrimeiroEvento: ReturnType<typeof setTimeout> | null = null;
const ouvintes = new Set<() => void>();

function avisar(novo: EstadoSensor) {
  if (novo === estado) return;
  estado = novo;
  ouvintes.forEach((o) => o());
}

function precisaPermissao() {
  const Classe = (window as unknown as { DeviceOrientationEvent?: OrientacaoComPermissao }).DeviceOrientationEvent;
  return typeof Classe?.requestPermission === "function";
}

function suportado() {
  return (
    typeof window !== "undefined" &&
    "DeviceOrientationEvent" in window &&
    // Só no toque: notebook com sensor de orientação não deve mexer a página.
    window.matchMedia("(pointer: coarse)").matches
  );
}

function limitar(v: number) {
  return Math.max(-1, Math.min(1, v));
}

function aoOrientar(e: DeviceOrientationEvent) {
  if (e.beta === null || e.gamma === null) return;
  if (estado !== "ativo") {
    if (esperaPrimeiroEvento) clearTimeout(esperaPrimeiroEvento);
    avisar("ativo");
  }

  // Com o celular deitado, os eixos trocam de papel.
  const angulo = screen.orientation?.angle ?? 0;
  let x = e.gamma;
  let y = e.beta;
  if (angulo === 90) [x, y] = [e.beta, -e.gamma];
  else if (angulo === 270 || angulo === -90) [x, y] = [-e.beta, e.gamma];

  // Perto da vertical o gamma dá saltos (gimbal); salto grande é descartado.
  if (ultimo && (Math.abs(x - ultimo.x) > 40 || Math.abs(y - ultimo.y) > 40)) {
    ultimo = { x, y };
    return;
  }
  ultimo = { x, y };

  if (!base) base = { x, y };
  base.x += (x - base.x) * DERIVA;
  base.y += (y - base.y) * DERIVA;

  const alvoX = limitar((x - base.x) / GRAUS_PARA_MAXIMO);
  const alvoY = limitar((y - base.y) / GRAUS_PARA_MAXIMO);
  suave = { x: suave.x + (alvoX - suave.x) * SUAVIZACAO, y: suave.y + (alvoY - suave.y) * SUAVIZACAO };
  inclinacaoX.set(suave.x);
  inclinacaoY.set(suave.y);
}

function ligar() {
  if (ouvindo) return;
  ouvindo = true;
  window.addEventListener("deviceorientation", aoOrientar);
  // No iPhone, sem permissão nenhum evento chega: se nada vier em pouco
  // tempo, oferecemos o botão de ativar.
  if (estado !== "ativo") {
    avisar("aguardando");
    esperaPrimeiroEvento = setTimeout(() => {
      if (estado === "aguardando") avisar(precisaPermissao() ? "precisa-permissao" : "indisponivel");
    }, 1200);
  }
}

function desligar() {
  if (!ouvindo) return;
  ouvindo = false;
  window.removeEventListener("deviceorientation", aoOrientar);
  if (esperaPrimeiroEvento) clearTimeout(esperaPrimeiroEvento);
  base = null;
  ultimo = null;
  suave = { x: 0, y: 0 };
  inclinacaoX.set(0);
  inclinacaoY.set(0);
}

/** Tem de ser chamado dentro de um toque (exigência do Safari). */
export async function pedirPermissao() {
  const Classe = (window as unknown as { DeviceOrientationEvent?: OrientacaoComPermissao }).DeviceOrientationEvent;
  try {
    const resposta = await Classe?.requestPermission?.();
    if (resposta === "granted") {
      avisar("aguardando");
      desligar();
      if (consumidores > 0) ligar();
    } else {
      avisar("negado");
    }
  } catch {
    avisar("negado");
  }
}

function inscrever(o: () => void) {
  ouvintes.add(o);
  return () => ouvintes.delete(o);
}

/**
 * Liga o sensor enquanto algum componente na tela o usa (`ativo`), e devolve
 * o estado para quem quiser mostrar o botão de permissão.
 */
export function useSensorInclinacao(ativo: boolean): EstadoSensor {
  useEffect(() => {
    if (!ativo || !suportado()) return;
    consumidores += 1;
    ligar();
    return () => {
      consumidores -= 1;
      if (consumidores === 0) desligar();
    };
  }, [ativo]);

  return useSyncExternalStore(inscrever, () => estado, () => "indisponivel" as EstadoSensor);
}
