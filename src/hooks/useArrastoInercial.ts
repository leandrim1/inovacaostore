import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { animate, useMotionValue, type AnimationPlaybackControls } from "framer-motion";

/**
 * Arrasto horizontal com inércia para girar objetos 3D pelo dedo (ou mouse).
 *
 * - O gesto horizontal gira; o vertical continua rolando a página: a área usa
 *   `touch-action: pan-y`, então o navegador fica com a rolagem e só os
 *   movimentos de lado chegam aqui. Se o dedo começa a descer, o navegador
 *   cancela o ponteiro e o objeto só volta ao lugar.
 * - Passou do limite, fica "elástico" (resistência crescente) e, ao soltar,
 *   quica de volta para dentro — nunca gira além do combinado.
 * - Ao soltar com velocidade, continua girando e desacelera (momentum).
 * - Opcionalmente volta devagar à posição inicial depois de um tempo parado.
 * - Um toque curto sem arrasto chama `onToque` (para abrir o produto, etc.),
 *   então tocar e arrastar nunca disputam a mesma intenção.
 *
 * `valor` é um MotionValue: a cena WebGL lê a cada quadro e o CSS usa via
 * `useTransform`, sem re-render do React durante o gesto.
 */
interface Opcoes {
  /** Quanto o valor anda por pixel arrastado (radianos por px na cena). */
  sensibilidade?: number;
  /** Limite ± antes do efeito elástico. `Infinity` gira livre (visualizador). */
  limite?: number;
  /** Volta sozinho ao zero depois de soltar. */
  retornar?: boolean;
  /** Espera (ms) antes de começar a voltar. */
  atrasoRetorno?: number;
  onToque?: (e: ReactPointerEvent<HTMLElement>) => void;
  desativado?: boolean;
}

const LIMIAR_ARRASTO = 6;
const LIMIAR_TOQUE_MS = 350;

function elastico(v: number, limite: number) {
  if (!Number.isFinite(limite) || Math.abs(v) <= limite) return v;
  const excesso = Math.abs(v) - limite;
  // Resistência crescente: quanto mais se força, menos anda.
  return Math.sign(v) * (limite + (excesso * limite) / (excesso + limite) * 0.55);
}

export function useArrastoInercial({
  sensibilidade = 0.012,
  limite = 0.7,
  retornar = true,
  atrasoRetorno = 1400,
  onToque,
  desativado = false,
}: Opcoes = {}) {
  const valor = useMotionValue(0);
  /** 1 enquanto o dedo está arrastando — a cena usa para "acender" a luz. */
  const arrastando = useMotionValue(0);

  const gesto = useRef<{
    id: number;
    inicioX: number;
    inicioY: number;
    inicioT: number;
    ultimoX: number;
    bruto: number;
    movendo: boolean;
    amostras: { x: number; t: number }[];
  } | null>(null);
  const animacao = useRef<AnimationPlaybackControls | null>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parar = useCallback(() => {
    animacao.current?.stop();
    animacao.current = null;
    if (espera.current) clearTimeout(espera.current);
    espera.current = null;
  }, []);

  const voltarAoInicio = useCallback(
    (suave = true) => {
      parar();
      animacao.current = animate(valor, 0, suave ? { type: "spring", stiffness: 26, damping: 11 } : { duration: 0.35 });
    },
    [parar, valor],
  );

  const agendarRetorno = useCallback(() => {
    if (!retornar) return;
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(() => voltarAoInicio(), atrasoRetorno);
  }, [atrasoRetorno, retornar, voltarAoInicio]);

  useEffect(() => parar, [parar]);
  useEffect(() => {
    if (desativado) {
      gesto.current = null;
      arrastando.set(0);
    }
  }, [desativado, arrastando]);

  const soltar = useCallback(
    (comVelocidade: boolean) => {
      const g = gesto.current;
      gesto.current = null;
      arrastando.set(0);
      if (!g?.movendo) return;

      let velocidade = 0;
      if (comVelocidade && g.amostras.length >= 2) {
        const primeira = g.amostras[0];
        const ultima = g.amostras[g.amostras.length - 1];
        const dt = ultima.t - primeira.t;
        if (dt > 0) velocidade = ((ultima.x - primeira.x) / dt) * 1000 * sensibilidade;
      }

      parar();
      const limitado = Number.isFinite(limite);
      animacao.current = animate(valor, valor.get(), {
        type: "inertia",
        velocity: velocidade,
        power: 0.35,
        timeConstant: 420,
        min: limitado ? -limite : undefined,
        max: limitado ? limite : undefined,
        bounceStiffness: 160,
        bounceDamping: 20,
        restDelta: 0.0005,
        onComplete: agendarRetorno,
      });
    },
    [agendarRetorno, arrastando, limite, parar, sensibilidade, valor],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (desativado || (e.pointerType === "mouse" && e.button !== 0)) return;
      if (gesto.current) return; // segundo dedo: é pinça, não arrasto
      parar();
      gesto.current = {
        id: e.pointerId,
        inicioX: e.clientX,
        inicioY: e.clientY,
        inicioT: e.timeStamp,
        ultimoX: e.clientX,
        bruto: valor.get(),
        movendo: false,
        amostras: [{ x: e.clientX, t: e.timeStamp }],
      };
    },
    [desativado, parar, valor],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const g = gesto.current;
      if (!g || g.id !== e.pointerId) return;
      const totalX = e.clientX - g.inicioX;
      const totalY = e.clientY - g.inicioY;

      if (!g.movendo) {
        if (Math.abs(totalX) > LIMIAR_ARRASTO && Math.abs(totalX) > Math.abs(totalY)) {
          g.movendo = true;
          arrastando.set(1);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // ponteiro já liberado pelo navegador
          }
        } else if (Math.abs(totalY) > 10) {
          // Intenção vertical (com mouse, que não tem touch-action): desiste.
          gesto.current = null;
          return;
        } else {
          return;
        }
      }

      g.bruto += (e.clientX - g.ultimoX) * sensibilidade;
      g.ultimoX = e.clientX;
      valor.set(elastico(g.bruto, limite));
      g.amostras.push({ x: e.clientX, t: e.timeStamp });
      while (g.amostras.length > 2 && e.timeStamp - g.amostras[0].t > 90) g.amostras.shift();
    },
    [arrastando, limite, sensibilidade, valor],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const g = gesto.current;
      if (!g || g.id !== e.pointerId) return;
      if (!g.movendo) {
        gesto.current = null;
        const curto = e.timeStamp - g.inicioT < LIMIAR_TOQUE_MS;
        const parado = Math.hypot(e.clientX - g.inicioX, e.clientY - g.inicioY) < 10;
        if (curto && parado) onToque?.(e);
        return;
      }
      soltar(true);
    },
    [onToque, soltar],
  );

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (gesto.current?.id !== e.pointerId) return;
      soltar(false);
      agendarRetorno();
    },
    [agendarRetorno, soltar],
  );

  /** Abandona o gesto atual sem inércia (ex.: entrou um segundo dedo — é pinça). */
  const cancelar = useCallback(() => {
    gesto.current = null;
    arrastando.set(0);
  }, [arrastando]);

  return {
    valor,
    arrastando,
    voltarAoInicio,
    cancelar,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
