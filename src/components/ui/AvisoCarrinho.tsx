import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { EVENTO_ADICIONADO, type InfoAdicionado } from "../../lib/vooAoCarrinho";

/**
 * Último tempo da microinteração de compra: depois que a cópia do produto
 * pousa no carrinho, um aviso sobe logo acima da barra inferior (no
 * computador, no canto) com o atalho "Ver carrinho". Some sozinho — não
 * interrompe quem quer continuar comprando.
 */
const TEMPO = 3400;

export function AvisoCarrinho() {
  const [aviso, setAviso] = useState<(InfoAdicionado & { chave: number }) | null>(null);
  const { openCart } = useCart();

  useEffect(() => {
    let espera: ReturnType<typeof setTimeout> | undefined;
    function mostrar(e: Event) {
      const info = (e as CustomEvent<InfoAdicionado>).detail;
      setAviso({ ...info, chave: Date.now() });
      if (espera) clearTimeout(espera);
      espera = setTimeout(() => setAviso(null), TEMPO);
    }
    window.addEventListener(EVENTO_ADICIONADO, mostrar);
    return () => {
      window.removeEventListener(EVENTO_ADICIONADO, mostrar);
      if (espera) clearTimeout(espera);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-[calc(var(--barra-inferior)+10px)] z-[60] flex justify-center lg:inset-x-auto lg:bottom-6 lg:right-6"
    >
      <AnimatePresence>
        {aviso && (
          <motion.div
            key={aviso.chave}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md bg-brand-ink p-2 pr-2.5 text-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]"
          >
            <span className="relative shrink-0">
              {aviso.imagem ? (
                <img src={aviso.imagem} alt="" className="h-12 w-10 rounded-[2px] object-cover" />
              ) : (
                <span className="block h-12 w-10 rounded-[2px] bg-white/10" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em] text-brand-yellow">
                <Check size={12} strokeWidth={3} aria-hidden /> Adicionado
              </span>
              <span className="block truncate text-sm font-medium">{aviso.nome}</span>
              {aviso.detalhe && <span className="block truncate text-xs text-white/60">{aviso.detalhe}</span>}
            </span>
            <button
              type="button"
              onClick={() => {
                setAviso(null);
                openCart();
              }}
              className="btn-accent btn-3d-accent shrink-0 !px-3.5 !py-2 text-xs"
            >
              Ver carrinho
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
