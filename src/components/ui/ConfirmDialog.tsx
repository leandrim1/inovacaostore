import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  /** Linha de apoio: o que exatamente será afetado. */
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` pinta o botão de vermelho — use para exclusões. */
  tone?: "danger" | "default";
  /** Trava os botões enquanto a ação está em andamento. */
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  tone = "danger",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useBodyScrollLock(isOpen);

  // O foco começa em "Cancelar", não em "Excluir": um Enter distraído logo
  // depois de abrir o diálogo não pode apagar nada.
  useEffect(() => {
    if (isOpen) cancelRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-brand-ink/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={description ? "confirm-dialog-description" : undefined}
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-4 p-6">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  tone === "danger" ? "bg-red-50 text-red-600" : "bg-brand-yellow/20 text-brand-yellow-dark"
                }`}
                aria-hidden
              >
                <AlertTriangle size={20} />
              </span>
              <div className="min-w-0">
                <h2 id="confirm-dialog-title" className="font-display text-lg tracking-wide text-brand-ink">
                  {title}
                </h2>
                {description && (
                  <p id="confirm-dialog-description" className="mt-1.5 text-sm leading-relaxed text-neutral-500">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-black/5 bg-neutral-50 px-6 py-4">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                disabled={isPending}
                className="rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-brand-ink hover:text-brand-ink disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60 ${
                  tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-brand-ink hover:bg-black"
                }`}
              >
                {isPending ? "Excluindo…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
