import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatBRL } from "../../lib/format";
import { QuantityStepper } from "../ui/QuantityStepper";

export function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity, subtotal, itemCount } =
    useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Carrinho de compras"
            className="fixed right-0 top-0 z-[71] flex h-dvh w-full max-w-md flex-col bg-white shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <header className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <h2 className="font-display text-lg tracking-wide">
                Sua sacola ({itemCount})
              </h2>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Fechar carrinho"
                className="rounded-full p-2 hover:bg-neutral-100"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-neutral-500">
                  <ShoppingBag size={40} strokeWidth={1.25} />
                  <p>Sua sacola está vazia.</p>
                  <Link
                    to="/categoria/camisetas"
                    onClick={closeCart}
                    className="btn-outline mt-2"
                  >
                    Ver produtos
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-5">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-3">
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/produto/${item.slug}`}
                            onClick={closeCart}
                            className="text-sm font-medium leading-snug hover:underline"
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            aria-label={`Remover ${item.name}`}
                            className="text-neutral-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <span className="mt-0.5 text-xs text-neutral-500">
                          {item.color} · {item.size}
                        </span>
                        <div className="mt-2 flex items-center justify-between">
                          <QuantityStepper
                            quantity={item.quantity}
                            onChange={(q) => updateQuantity(item.key, q)}
                          />
                          <span className="font-display text-sm">
                            {formatBRL(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-black/5 px-5 py-5">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-display text-lg">{formatBRL(subtotal)}</span>
                </div>
                <Link
                  to="/carrinho"
                  onClick={closeCart}
                  className="btn-primary w-full"
                >
                  Finalizar compra
                </Link>
                <p className="mt-2 text-center text-xs text-neutral-400">
                  Frete e cupom calculados no carrinho
                </p>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
