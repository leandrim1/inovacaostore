import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { X, MessageCircle, User, PackageSearch, LogOut } from "lucide-react";
import { STORE, buildWhatsAppLink } from "../../data/store";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { InstagramIcon } from "../ui/InstagramIcon";

export function MobileMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();

  async function handleLogout() {
    onClose();
    await logout();
    navigate("/");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-brand-ink/50 backdrop-blur-sm lg:hidden"
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
            <div className="flex items-center justify-between border-b border-brand-ink/10 px-5 py-4">
              <span className="font-display text-lg tracking-wide">Menu</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="rounded-full p-2 transition-colors hover:bg-neutral-100"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-4">
              <Link
                to="/"
                onClick={onClose}
                className="group flex items-center justify-between rounded-lg px-2 py-3 font-display text-lg tracking-wide transition-colors hover:bg-brand-cream"
              >
                Início
                <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/categoria/${cat.slug}`}
                  onClick={onClose}
                  className="group flex items-center justify-between rounded-lg px-2 py-3 font-display text-lg tracking-wide transition-colors hover:bg-brand-cream"
                >
                  {cat.name}
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3 border-t border-brand-ink/10 px-5 py-5">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-brand-ink">
                    <User size={18} />
                    Olá, {user.name.split(" ")[0]}
                  </div>
                  <Link
                    to="/minha-conta"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-brand-ink"
                  >
                    Minha conta
                  </Link>
                  <Link
                    to="/meus-pedidos"
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-brand-ink"
                  >
                    <PackageSearch size={15} /> Meus pedidos
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={15} /> Sair
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="btn-outline !flex-1 !px-4 !py-2.5 !text-xs"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/cadastro"
                    onClick={onClose}
                    className="btn-primary !flex-1 !px-4 !py-2.5 !text-xs"
                  >
                    Criar conta
                  </Link>
                </div>
              )}
              <a
                href={buildWhatsAppLink(settings.whatsappNumber, "Olá! Vim pelo site e gostaria de tirar uma dúvida.")}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-green-700 transition-opacity hover:opacity-70"
              >
                <MessageCircle size={18} />
                Fale no WhatsApp
              </a>
              <a
                href={STORE.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-brand-ink transition-opacity hover:opacity-70"
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
