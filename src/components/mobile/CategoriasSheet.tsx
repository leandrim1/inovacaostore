import { useEffect } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles, X } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { PlaceholderImage } from "../ui/PlaceholderImage";

/**
 * Folha de categorias que sobe do rodapé (aba "Categorias" da barra
 * inferior). As capas aparecem como peças em relevo que afundam ao toque;
 * arrastar a alça para baixo, tocar fora ou apertar Esc fecha.
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
            className="fixed inset-0 z-[70] bg-brand-ink/55 backdrop-blur-md lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFechar}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Categorias"
            className="fixed inset-x-0 bottom-0 z-[71] flex max-h-[86svh] flex-col rounded-t-[28px] bg-brand-cream pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.6)] lg:hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
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
              <span className="mx-auto mb-3 block h-1.5 w-11 rounded-full bg-brand-ink/20" aria-hidden />
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl tracking-wide text-brand-ink">Categorias</h2>
                <button
                  type="button"
                  onClick={onFechar}
                  aria-label="Fechar categorias"
                  className="grid h-11 w-11 place-items-center rounded-full active:bg-brand-ink/5"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 overflow-y-auto overscroll-contain px-5 pb-2">
              {categorias.map((cat, i) => (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, y: 24, rotateX: 18, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                  transition={{ delay: 0.08 + i * 0.05, type: "spring", stiffness: 300, damping: 26 }}
                  style={{ transformPerspective: 700 }}
                >
                  <Link
                    to={`/categoria/${cat.slug}`}
                    onClick={onFechar}
                    className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl bg-neutral-900 shadow-[0_14px_28px_-16px_rgba(0,0,0,0.7),0_3px_0_rgba(0,0,0,0.25)] transition-transform duration-150 active:translate-y-[3px] active:scale-[0.97]"
                  >
                    {cat.coverImage ? (
                      <img src={cat.coverImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <span className="absolute inset-0">
                        <PlaceholderImage />
                      </span>
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    <span className="relative flex items-end justify-between gap-2 p-3">
                      <span className="font-display text-xl leading-none text-white">{cat.name}</span>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-yellow text-brand-ink">
                        <ArrowUpRight size={15} />
                      </span>
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="px-5 pt-3">
              <Link
                to="/destaques"
                onClick={onFechar}
                className="btn-primary btn-3d-primary w-full"
              >
                <Sparkles size={16} className="text-brand-yellow" />
                Ver os destaques
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
