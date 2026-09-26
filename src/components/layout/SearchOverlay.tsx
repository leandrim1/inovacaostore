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
            className="fixed inset-0 z-[70] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar produtos"
            className="fixed inset-x-0 top-0 z-[71] bg-white"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="container-page flex flex-col gap-5 py-8 sm:py-10">
              <div className="flex items-center justify-between">
                <span className="rotulo text-neutral-500">Buscar produtos</span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar busca"
                  className="-mr-2 grid h-11 w-11 place-items-center transition-colors hover:bg-neutral-100"
                >
                  <X size={20} />
                </button>
              </div>
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-4 border-b-2 border-brand-ink/15 pb-4 transition-colors focus-within:border-brand-ink"
              >
                <Search
                  size={24}
                  className={`shrink-0 transition-colors duration-200 ${query.trim() ? "text-brand-ink" : "text-brand-ink/40"}`}
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
              </form>
              <div className="flex flex-col gap-3">
                <span className="rotulo text-neutral-500">Sugestões</span>
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
                      className="min-h-11 rounded-[3px] border border-brand-ink/15 bg-white px-4 py-2 text-sm text-neutral-700 transition-colors hover:border-brand-ink hover:text-brand-ink active:bg-neutral-100"
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
