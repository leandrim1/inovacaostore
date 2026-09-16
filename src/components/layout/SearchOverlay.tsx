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
            className="fixed inset-x-0 top-0 z-[71] bg-white shadow-xl"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="container-page flex flex-col gap-4 py-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg tracking-wide">Buscar</span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar busca"
                  className="rounded-full p-2 hover:bg-neutral-100"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-brand-ink/20 pb-3">
                <Search size={20} className="text-neutral-400" />
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="O que você está procurando?"
                  className="w-full bg-transparent text-lg outline-none placeholder:text-neutral-400"
                />
              </form>
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
                    className="rounded-full border border-black/10 px-3 py-1.5 text-sm text-neutral-600 hover:border-brand-ink hover:text-brand-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
