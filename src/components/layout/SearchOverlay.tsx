import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

const SUGGESTIONS = ["Camiseta", "Calça jeans", "Bermuda", "Jaqueta", "Boné"];

export function SearchOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  useBodyScrollLock(isOpen);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/busca?q=${encodeURIComponent(query.trim())}`);
    onClose();
    setQuery("");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-brand-ink/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar produtos"
            className="fixed inset-x-0 top-0 z-[71] bg-white shadow-xl"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="container-page flex flex-col gap-5 py-8 sm:py-10">
              <div className="flex items-center justify-between">
                <span className="section-eyebrow text-neutral-400">Buscar produtos</span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar busca"
                  className="rounded-full p-2 transition-colors hover:bg-neutral-100"
                >
                  <X size={20} />
                </button>
              </div>
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.08, type: "spring", stiffness: 380, damping: 28 }}
                className="flex items-center gap-4 border-b-2 border-brand-ink/15 pb-4 transition-colors focus-within:border-brand-yellow"
              >
                <Search
                  size={24}
                  className={`shrink-0 transition-all duration-300 ${
                    query.trim() ? "scale-110 text-brand-yellow-dark drop-shadow-[0_0_8px_rgba(245,196,0,0.6)]" : "text-brand-ink/40"
                  }`}
                />
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="O que você está procurando?"
                  enterKeyHint="search"
                  className="w-full bg-transparent font-display text-2xl tracking-wide outline-none placeholder:text-brand-ink/25 sm:text-3xl"
                />
              </motion.form>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
                  Sugestões
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, y: 12, rotateX: -40 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 400, damping: 28 }}
                      style={{ transformPerspective: 500 }}
                      type="button"
                      onClick={() => {
                        navigate(`/busca?q=${encodeURIComponent(s)}`);
                        onClose();
                        setQuery("");
                      }}
                      className="min-h-11 rounded-full border border-brand-ink/15 bg-white px-4 py-2 text-sm text-neutral-600 shadow-[0_2px_0_rgba(10,10,10,0.08)] transition-[color,border-color,box-shadow,translate] hover:border-brand-ink hover:text-brand-ink active:translate-y-[2px] active:shadow-none"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
