import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { EVENTO_ADICIONADO, type InfoAdicionado } from "../../lib/vooAoCarrinho";

/**
 * Último tempo da microinteração de compra: depois que a cópia do produto
 * pousa no carrinho, um aviso de vidro sobe logo acima da barra inferior
 * (no computador, no canto) com o atalho "Ver carrinho". Some sozinho — não
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
            initial={{ opacity: 0, y: 28, scale: 0.94, rotateX: 28 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{ transformPerspective: 700 }}
            className="vidro-escuro pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl p-2.5 pr-3 text-white"
          >
            <span className="relative shrink-0">
              {aviso.imagem ? (
                <img src={aviso.imagem} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <span className="block h-12 w-12 rounded-xl bg-white/10" />
              )}
              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-brand-yellow text-brand-ink ring-2 ring-brand-ink">
                <Check size={12} strokeWidth={3} />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[11px] tracking-[0.25em] text-brand-yellow">No carrinho</span>
              <span className="block truncate text-sm font-medium">{aviso.nome}</span>
              {aviso.detalhe && <span className="block truncate text-xs text-white/60">{aviso.detalhe}</span>}
            </span>
            <button
              type="button"
              onClick={() => {
                setAviso(null);
                openCart();
              }}
              className="btn-accent btn-3d-accent shrink-0 px-4 py-2 text-xs"
            >
              Ver carrinho
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
