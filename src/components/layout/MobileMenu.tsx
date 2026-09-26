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
 * Menu do celular: um painel escuro que entra girando de leve em perspectiva
 * (como uma porta de vitrine abrindo), com os itens chegando em sequência e
 * dois anéis de luz orbitando no fundo. O fundo da página escurece e desfoca.
 * Fechar faz o caminho inverso, rápido. Todos os alvos têm ao menos 44 px.
 */
const lista: Variants = {
  aberto: { transition: { staggerChildren: 0.045, delayChildren: 0.12 } },
  fechado: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
};

const item: Variants = {
  aberto: { opacity: 1, x: 0, rotateY: 0, transition: { type: "spring", stiffness: 380, damping: 30 } },
  fechado: { opacity: 0, x: -24, rotateY: 25, transition: { duration: 0.15 } },
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
            className="fixed inset-0 z-[70] bg-brand-ink/55 backdrop-blur-md lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            onClick={onClose}
          />
          <motion.aside
            aria-label="Menu"
            className="fixed left-0 top-0 z-[71] flex h-dvh w-[86vw] max-w-sm flex-col overflow-hidden bg-brand-ink text-white shadow-[24px_0_60px_-20px_rgba(0,0,0,0.8)] lg:hidden"
            initial={{ x: "-100%", rotateY: 22, opacity: 0.6 }}
            animate={{ x: 0, rotateY: 0, opacity: 1 }}
            exit={{ x: "-100%", rotateY: 18, opacity: 0.6, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            style={{ transformPerspective: 1100, transformOrigin: "0% 50%" }}
          >
            {/* Anéis de luz orbitando atrás do conteúdo. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 [perspective:700px]">
              <span className="absolute -right-24 top-24 h-72 w-72 animate-orbita rounded-full border border-brand-yellow/25 shadow-[0_0_40px_rgba(245,196,0,0.15)] motion-reduce:animate-none" />
              <span className="absolute -right-10 top-44 h-44 w-44 animate-orbita rounded-full border border-white/10 [animation-direction:reverse] [animation-duration:18s] motion-reduce:animate-none" />
              <span className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-brand-yellow/10 blur-3xl" />
            </div>

            <div className="relative flex items-center justify-between px-5 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <span className="font-display text-sm tracking-[0.35em] text-brand-yellow">Menu</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] transition-transform active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <motion.nav
              className="relative flex flex-1 flex-col overflow-y-auto px-3 py-2"
              variants={lista}
              initial="fechado"
              animate="aberto"
              exit="fechado"
              style={{ perspective: 800 }}
            >
              {links.map((link, i) => {
                const ativo = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
                return (
                  <motion.div key={link.to} variants={item} style={{ transformOrigin: "0% 50%" }}>
                    <Link
                      to={link.to}
                      onClick={onClose}
                      aria-current={ativo ? "page" : undefined}
                      className={`group flex min-h-[52px] items-center gap-3 rounded-2xl px-3 transition-colors active:bg-white/[0.08] ${
                        ativo ? "bg-white/[0.06] text-brand-yellow" : "text-white"
                      }`}
                    >
                      <span className="w-6 font-mono text-[11px] tabular-nums text-white/35">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1 font-display text-2xl tracking-wide">{link.rotulo}</span>
                      <ArrowUpRight
                        size={18}
                        className={`transition-transform group-active:translate-x-0.5 ${ativo ? "text-brand-yellow" : "text-white/35"}`}
                      />
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div variants={item}>
                <Link
                  to="/favoritos"
                  onClick={onClose}
                  className="mt-1 flex min-h-[52px] items-center gap-3 rounded-2xl px-3 text-white/80 active:bg-white/[0.08]"
                >
                  <Heart size={18} className="text-brand-yellow" />
                  <span className="font-display text-lg tracking-wide">Favoritos</span>
                </Link>
              </motion.div>
            </motion.nav>

            <motion.div
              className="relative m-3 flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/[0.04] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
              exit={{ opacity: 0 }}
            >
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
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                        <User size={16} />
                      </span>
                    )}
                    Olá, {user.name.split(" ")[0]}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/minha-conta"
                      onClick={onClose}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/[0.07] text-sm active:scale-[0.97]"
                    >
                      <User size={15} /> Minha conta
                    </Link>
                    <Link
                      to="/meus-pedidos"
                      onClick={onClose}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/[0.07] text-sm active:scale-[0.97]"
                    >
                      <PackageSearch size={15} /> Pedidos
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-left text-sm text-red-400 active:bg-red-500/10"
                  >
                    <LogOut size={15} /> Sair
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="flex min-h-11 items-center justify-center rounded-full border border-white/20 font-display text-xs tracking-[0.15em] active:scale-[0.97]"
                  >
                    Entrar
                  </Link>
                  <Link to="/cadastro" onClick={onClose} className="btn-accent btn-3d-accent px-4 py-2.5 text-xs">
                    Criar conta
                  </Link>
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <a
                  href={buildWhatsAppLink(settings.whatsappNumber, "Olá! Vim pelo site e gostaria de tirar uma dúvida.")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 flex-1 items-center gap-2 rounded-xl px-2 text-sm font-medium text-green-400 active:bg-white/[0.06]"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
                <a
                  href={STORE.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-2 text-sm font-medium text-white/80 active:bg-white/[0.06]"
                >
                  <InstagramIcon size={18} className="shrink-0" />
                  <span className="truncate">{STORE.social.instagramHandle}</span>
                </a>
              </div>
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
