import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { X, MessageCircle, User, PackageSearch, LogOut, ArrowUpRight, Heart } from "lucide-react";
import { STORE, buildWhatsAppLink } from "../../data/store";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { InstagramIcon } from "../ui/InstagramIcon";
import { UserAvatar } from "../account/UserAvatar";

/**
 * Menu do celular: um painel preto que desliza da esquerda, com as
 * categorias em letra grande separadas por réguas — o mesmo índice da home.
 * O fundo da página escurece. Rápido para abrir e para fechar; todos os
 * alvos têm ao menos 44 px.
 */
const lista: Variants = {
  aberto: { transition: { staggerChildren: 0.025, delayChildren: 0.06 } },
  fechado: {},
};

const item: Variants = {
  aberto: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  fechado: { opacity: 0, x: -8 },
};

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
  const { pathname } = useLocation();
  useBodyScrollLock(isOpen);

  async function handleLogout() {
    onClose();
    await logout();
    navigate("/");
  }

  const links = [
    { to: "/", rotulo: "Início" },
    ...categories.map((c) => ({ to: `/categoria/${c.slug}`, rotulo: c.name })),
    { to: "/destaques", rotulo: "Destaques" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/60 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            onClick={onClose}
          />
          <motion.aside
            aria-label="Menu"
            className="fixed left-0 top-0 z-[71] flex h-dvh w-[86vw] max-w-sm flex-col overflow-hidden bg-brand-ink text-white lg:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative flex items-center justify-between px-5 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <span className="rotulo text-white/50">Menu</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="-mr-2 grid h-11 w-11 place-items-center transition-transform active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <motion.nav
              className="relative flex flex-1 flex-col overflow-y-auto px-5 py-2"
              variants={lista}
              initial="fechado"
              animate="aberto"
              exit="fechado"
            >
              <div className="border-t border-white/10">
                {links.map((link) => {
                  const ativo = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
                  return (
                    <motion.div key={link.to} variants={item} className="border-b border-white/10">
                      <Link
                        to={link.to}
                        onClick={onClose}
                        aria-current={ativo ? "page" : undefined}
                        className="flex min-h-[56px] items-center gap-3 active:bg-white/[0.05]"
                      >
                        <span className={`flex-1 font-display text-[2rem] leading-none ${ativo ? "text-brand-yellow" : "text-white"}`}>
                          {link.rotulo}
                        </span>
                        <ArrowUpRight size={18} strokeWidth={1.6} className="text-white/35" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              <motion.div variants={item}>
                <Link
                  to="/favoritos"
                  onClick={onClose}
                  className="mt-2 flex min-h-12 items-center gap-2.5 text-[15px] text-white/80 active:text-white"
                >
                  <Heart size={17} strokeWidth={1.8} />
                  Favoritos
                </Link>
              </motion.div>
            </motion.nav>

            <div className="relative flex flex-col gap-2 border-t border-white/10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2.5 text-sm font-medium">
                    {user.avatarUrl ? (
                      <UserAvatar
                        name={user.name}
                        avatarUrl={user.avatarUrl}
                        letras={1}
                        className="h-8 w-8 bg-brand-yellow text-xs font-bold text-brand-ink"
                      />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15">
                        <User size={16} />
                      </span>
                    )}
                    Olá, {user.name.split(" ")[0]}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/minha-conta"
                      onClick={onClose}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-white/15 text-sm active:bg-white/10"
                    >
                      <User size={15} /> Minha conta
                    </Link>
                    <Link
                      to="/meus-pedidos"
                      onClick={onClose}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-white/15 text-sm active:bg-white/10"
                    >
                      <PackageSearch size={15} /> Pedidos
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 items-center gap-2 text-left text-sm text-red-400 active:text-red-300"
                  >
                    <LogOut size={15} /> Sair
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="flex min-h-11 items-center justify-center rounded-[3px] border border-white/25 font-display text-sm tracking-[0.1em] active:bg-white/10"
                  >
                    Entrar
                  </Link>
                  <Link to="/cadastro" onClick={onClose} className="btn-accent btn-3d-accent !px-4 !py-2.5 text-sm">
                    Criar conta
                  </Link>
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <a
                  href={buildWhatsAppLink(settings.whatsappNumber, "Olá! Vim pelo site e gostaria de tirar uma dúvida.")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 flex-1 items-center gap-2 text-sm font-medium text-white/80 active:text-white"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
                <a
                  href={STORE.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-sm font-medium text-white/80 active:text-white"
                >
                  <InstagramIcon size={18} className="shrink-0" />
                  <span className="truncate">{STORE.social.instagramHandle}</span>
                </a>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
