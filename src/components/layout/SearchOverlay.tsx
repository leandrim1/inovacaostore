import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";

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
              <form onSubmit={handleSubmit} className="flex items-center gap-4 border-b border-brand-ink/15 pb-4">
                <Search size={24} className="shrink-0 text-brand-ink/40" />
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="O que você está procurando?"
                  className="w-full bg-transparent font-display text-2xl tracking-wide outline-none placeholder:text-brand-ink/25 sm:text-3xl"
                />
              </form>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
                  Sugestões
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        navigate(`/busca?q=${encodeURIComponent(s)}`);
                        onClose();
                        setQuery("");
                      }}
                      className="rounded-full border border-brand-ink/15 px-4 py-2 text-sm text-neutral-600 transition-colors hover:border-brand-ink hover:text-brand-ink"
                    >
                      {s}
                    </button>
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
