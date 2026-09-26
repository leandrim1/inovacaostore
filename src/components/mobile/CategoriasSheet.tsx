import { useEffect } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, X } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

/**
 * Folha de categorias que sobe do rodapé (aba "Categorias" da barra
 * inferior): o mesmo índice da home — nome grande, capa pequena ao lado,
 * réguas entre as linhas. Arrastar a alça para baixo, tocar fora ou apertar
 * Esc fecha.
 */
export function CategoriasSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { data: categorias = [] } = useCategories();
  const arrasto = useDragControls();
  useBodyScrollLock(aberto);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto, onFechar]);

  return (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/60 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFechar}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Categorias"
            className="fixed inset-x-0 bottom-0 z-[71] flex max-h-[86svh] flex-col rounded-t-xl bg-brand-cream pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            drag="y"
            dragControls={arrasto}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onFechar();
            }}
          >
            <div className="touch-none px-5 pb-3 pt-2" onPointerDown={(e) => arrasto.start(e)}>
              <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-brand-ink/20" aria-hidden />
              <div className="flex items-center justify-between">
                <h2 className="rotulo text-neutral-500">Categorias</h2>
                <button
                  type="button"
                  onClick={onFechar}
                  aria-label="Fechar categorias"
                  className="-mr-2 grid h-11 w-11 place-items-center active:bg-brand-ink/5"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <ul className="mx-5 overflow-y-auto overscroll-contain border-t border-brand-ink/15">
              {categorias.map((cat) => (
                <li key={cat.slug} className="border-b border-brand-ink/15">
                  <Link
                    to={`/categoria/${cat.slug}`}
                    onClick={onFechar}
                    className="flex min-h-[72px] items-center gap-4 py-2 active:bg-brand-ink/[0.04]"
                  >
                    <span className="min-w-0 flex-1 font-display text-[2.4rem] leading-none text-brand-ink">{cat.name}</span>
                    {cat.coverImage && (
                      <img src={cat.coverImage} alt="" loading="lazy" className="h-14 w-11 shrink-0 rounded-[2px] object-cover" />
                    )}
                    <ArrowUpRight size={20} strokeWidth={1.6} className="shrink-0 text-brand-ink/40" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="px-5 pt-4">
              <Link to="/destaques" onClick={onFechar} className="btn-primary btn-3d-primary w-full">
                Ver os destaques
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
