import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/** Mesmo modal do resto da loja (depoimento, endereço): fundo escuro com desfoque, cartão branco. */
export function ProfilePhotoDialog({
  aberto,
  onFechar,
  bloqueado,
  children,
}: {
  aberto: boolean;
  onFechar: () => void;
  bloqueado: boolean;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFechar}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Foto de perfil"
            className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-brand-ink/10 px-5 py-4">
              <h2 className="font-display text-sm tracking-widest text-neutral-500">FOTO DE PERFIL</h2>
              <button
                type="button"
                onClick={onFechar}
                disabled={bloqueado}
                aria-label="Fechar"
                className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-ink disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
