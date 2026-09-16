import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X, MessageCircle, User } from "lucide-react";
import { CATEGORIES } from "../../data/categories";
import { STORE, buildWhatsAppLink } from "../../data/store";
import { useAuth } from "../../context/AuthContext";
import { InstagramIcon } from "../ui/InstagramIcon";

export function MobileMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { customer, openAccount } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed left-0 top-0 z-[71] flex h-dvh w-[85vw] max-w-sm flex-col bg-white shadow-2xl lg:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <span className="font-display text-lg tracking-wide">Menu</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="rounded-full p-2 hover:bg-neutral-100"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-4">
              <Link
                to="/"
                onClick={onClose}
                className="rounded-lg px-2 py-3 font-display text-lg tracking-wide hover:bg-neutral-50"
              >
                Início
              </Link>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/categoria/${cat.slug}`}
                  onClick={onClose}
                  className="rounded-lg px-2 py-3 font-display text-lg tracking-wide hover:bg-neutral-50"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3 border-t border-black/5 px-5 py-5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAccount();
                }}
                className="flex items-center gap-2 text-sm font-medium text-brand-ink"
              >
                <User size={18} />
                {customer ? customer.name : "Entrar / Cadastrar"}
              </button>
              <a
                href={buildWhatsAppLink("Olá! Vim pelo site e gostaria de tirar uma dúvida.")}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-green-700"
              >
                <MessageCircle size={18} />
                Fale no WhatsApp
              </a>
              <a
                href={STORE.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-brand-ink"
              >
                <InstagramIcon size={18} />
                {STORE.social.instagramHandle}
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
