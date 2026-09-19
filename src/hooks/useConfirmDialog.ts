import { useCallback, useState } from "react";

interface ConfirmRequest {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "danger" | "default";
  onConfirm: () => void | Promise<void>;
}

/**
 * Substitui o `confirm()` do navegador por um diálogo próprio.
 *
 * Uso: `ask({ title, description, onConfirm })` abre o diálogo e só executa
 * `onConfirm` se a pessoa confirmar. Espalhe `dialogProps` no `<ConfirmDialog />`.
 */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const ask = useCallback((req: ConfirmRequest) => {
    setRequest(req);
    setIsOpen(true);
  }, []);

  // Só fecha: o `request` continua em memória para o texto não sumir no meio
  // da animação de saída do diálogo.
  const cancel = useCallback(() => {
    if (!isPending) setIsOpen(false);
  }, [isPending]);

  const confirm = useCallback(async () => {
    if (!request) return;
    setIsPending(true);
    try {
      await request.onConfirm();
    } finally {
      setIsPending(false);
      setIsOpen(false);
    }
  }, [request]);

  return {
    ask,
    dialogProps: {
      isOpen,
      title: request?.title ?? "",
      description: request?.description,
      confirmLabel: request?.confirmLabel,
      tone: request?.tone,
      isPending,
      onConfirm: confirm,
      onCancel: cancel,
    },
  };
}
