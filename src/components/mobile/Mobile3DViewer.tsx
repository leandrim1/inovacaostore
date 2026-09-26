import { Suspense, lazy, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { useArrastoInercial } from "../../hooks/useArrastoInercial";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useExperiencia3D } from "../../lib/experiencia3d";
import { inclinacaoX, inclinacaoY, useSensorInclinacao } from "../../lib/sensorInclinacao";
import { ProdutoCSS } from "../3d/ProdutoCSS";
import { LimiteDaCena } from "../3d/LimiteDaCena";
import type { ProdutoVitrine } from "../3d/qualidade";

const ProductViewer = lazy(() => import("../3d/ProductViewer"));

const ZOOM_MAXIMO = 2.4;

/** Leva qualquer ângulo para -π..π (para "voltar" pelo caminho curto). */
function normalizar(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/**
 * "Ver em 3D": o produto em tela cheia num fundo de estúdio.
 *
 * - arrastar (dedo ou mouse) gira livre, com inércia — frente e costas;
 * - pinça aproxima (até 2,4×); toque duplo volta à posição inicial;
 * - botões "Frente", "Costas" e "Recentralizar" fazem o mesmo sem gesto, e
 *   as setas do teclado giram — ninguém depende de precisão no toque;
 * - Esc ou o X fecham.
 *
 * Com WebGL, a cena de verdade (luz, sombra); no nível "baixo", a mesma
 * peça em CSS 3D. Aqui a área inteira é do gesto
 * (`touch-action: none`): é um modal, não há página para rolar por trás.
 */
export function Mobile3DViewer({
  aberto,
  produto,
  onFechar,
}: {
  aberto: boolean;
  produto: ProdutoVitrine | null;
  onFechar: () => void;
}) {
  useBodyScrollLock(aberto);
  return (
    <AnimatePresence>
      {aberto && produto && <Visualizador produto={produto} onFechar={onFechar} />}
    </AnimatePresence>
  );
}

function Visualizador({ produto, onFechar }: { produto: ProdutoVitrine; onFechar: () => void }) {
  const { nivel, reduzido, toque } = useExperiencia3D();
  useSensorInclinacao(toque && !reduzido);
  const [cenaPronta, setCenaPronta] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const zoom = useRef(1);
  const zoomCss = useMotionValue(1);
  const ultimoToque = useRef(0);
  const ponteiros = useRef(new Map<number, { x: number; y: number }>());
  const pinca = useRef<{ d0: number; z0: number } | null>(null);
  const dialogo = useRef<HTMLDivElement>(null);

  const arrasto = useArrastoInercial({
    limite: Infinity,
    retornar: false,
    sensibilidade: 0.012,
    // Toque duplo (dois toques curtos em menos de 320 ms) volta ao início.
    onToque: (e) => {
      if (e.timeStamp - ultimoToque.current < 320) recentralizar();
      ultimoToque.current = e.timeStamp;
    },
  });

  useEffect(() => {
    dialogo.current?.focus();
  }, []);

  function aplicarZoom(z: number, suave = false) {
    const alvo = Math.min(ZOOM_MAXIMO, Math.max(1, z));
    if (suave) {
      animate(zoomCss, alvo, { type: "spring", stiffness: 300, damping: 30, onUpdate: (v) => (zoom.current = v) });
    } else {
      zoom.current = alvo;
      zoomCss.set(alvo);
    }
  }

  function girarPara(angulo: number) {
    arrasto.cancelar();
    const atual = arrasto.valor.get();
    // Caminho curto até o ângulo pedido, a partir de onde a peça está.
    const destino = atual + normalizar(angulo - atual);
    animate(arrasto.valor, destino, { type: "spring", stiffness: 60, damping: 14 });
  }

  function recentralizar() {
    girarPara(0);
    aplicarZoom(1, true);
  }

  function aoPressionar(e: ReactPointerEvent<HTMLElement>) {
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ponteiros.current.size === 2) {
      arrasto.cancelar();
      const [a, b] = [...ponteiros.current.values()];
      pinca.current = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: zoom.current };
      return;
    }
    if (ponteiros.current.size === 1) arrasto.handlers.onPointerDown(e);
  }

  function aoMover(e: ReactPointerEvent<HTMLElement>) {
    if (!ponteiros.current.has(e.pointerId)) return;
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinca.current && ponteiros.current.size >= 2) {
      const [a, b] = [...ponteiros.current.values()];
      aplicarZoom((pinca.current.z0 * Math.hypot(a.x - b.x, a.y - b.y)) / pinca.current.d0);
      return;
    }
    if (!pinca.current) arrasto.handlers.onPointerMove(e);
  }

  function aoSoltar(e: ReactPointerEvent<HTMLElement>) {
    ponteiros.current.delete(e.pointerId);
    if (pinca.current) {
      if (ponteiros.current.size === 0) pinca.current = null;
      return;
    }
    if (e.type === "pointercancel") arrasto.handlers.onPointerCancel(e);
    else arrasto.handlers.onPointerUp(e);
  }

  function teclado(e: KeyboardEvent) {
    if (e.key === "Escape") onFechar();
    else if (e.key === "ArrowLeft") girarPara(arrasto.valor.get() - 0.5);
    else if (e.key === "ArrowRight") girarPara(arrasto.valor.get() + 0.5);
    else if (e.key === "+" || e.key === "=") aplicarZoom(zoom.current + 0.3, true);
    else if (e.key === "-") aplicarZoom(zoom.current - 0.3, true);
  }

  const usaWebGL = nivel !== "baixo" && !falhou;
  const mostrarCena = usaWebGL && cenaPronta;

  return (
    <motion.div
      ref={dialogo}
      role="dialog"
      aria-modal="true"
      aria-label={`${produto.nome} em 3D`}
      tabIndex={-1}
      onKeyDown={teclado}
      className="fixed inset-0 z-[80] flex flex-col bg-brand-ink text-white outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
    >
      {/* Fundo de estúdio: a luz caindo de cima num cinza neutro, escurecendo
          para o chão — o fundo de uma foto de produto, não um palco. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_8%,#303030,rgba(48,48,48,0)_70%),linear-gradient(180deg,#1c1c1c,#0d0d0d)]" />

      <div className="relative z-10 flex items-start justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0 pt-1.5">
          <p className="truncate text-[15px] font-medium">{produto.nome}</p>
          <p className="text-sm text-white/60">{produto.preco}</p>
        </div>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar visualização 3D"
          className="-mr-2 grid h-11 w-11 shrink-0 place-items-center transition-transform active:scale-90"
        >
          <X size={20} />
        </button>
      </div>

      <div
        className="relative flex-1 select-none [touch-action:none]"
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
      >
        <motion.div
          aria-hidden
          className={`absolute inset-x-4 bottom-4 top-6 transition-opacity duration-500 ${mostrarCena ? "opacity-0" : "opacity-100"}`}
          style={{ scale: zoomCss }}
        >
          <ProdutoCSS produto={produto} rotacao={arrasto.valor} giroX={inclinacaoX} giroY={inclinacaoY} />
        </motion.div>
        {usaWebGL && (
          <div aria-hidden className={`absolute inset-0 transition-opacity duration-500 ${mostrarCena ? "opacity-100" : "opacity-0"}`}>
            <LimiteDaCena onErro={() => setFalhou(true)}>
              <Suspense fallback={null}>
                <ProductViewer
                  produto={produto}
                  nivel={nivel === "alto" ? "alto" : "medio"}
                  rotacao={arrasto.valor}
                  arrastando={arrasto.arrastando}
                  giroX={inclinacaoX}
                  giroY={inclinacaoY}
                  zoom={zoom}
                  onPronto={() => setCenaPronta(true)}
                />
              </Suspense>
            </LimiteDaCena>
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="text-center text-xs text-white/50">Arraste para girar · pinça para aproximar · toque duplo volta</p>
        <div className="flex w-full max-w-xs items-stretch divide-x divide-white/15 border border-white/15">
          <button
            type="button"
            onClick={() => girarPara(0)}
            className="min-h-11 flex-1 font-display text-sm tracking-[0.1em] active:bg-white/10"
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => girarPara(Math.PI)}
            className="min-h-11 flex-1 font-display text-sm tracking-[0.1em] active:bg-white/10"
          >
            Costas
          </button>
          <button
            type="button"
            onClick={recentralizar}
            aria-label="Recentralizar"
            className="grid min-h-11 w-12 place-items-center active:bg-white/10"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
