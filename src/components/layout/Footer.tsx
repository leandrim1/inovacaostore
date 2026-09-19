import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Mail, MapPin } from "lucide-react";
import { Logo } from "../ui/Logo";
import { InstagramIcon } from "../ui/InstagramIcon";
import { STORE, buildWhatsAppLink, formatWhatsAppDisplay } from "../../data/store";
import { useCategories } from "../../hooks/useCategories";
import { useSiteSettings } from "../../hooks/useSiteSettings";

const SOCIAL_BUTTON_CLASS =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-ink/10 bg-white text-brand-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:bg-neutral-50 active:scale-95";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <h3 className="font-display text-xs tracking-[0.3em] text-neutral-400">{title}</h3>
      <ul className="flex flex-col gap-3.5 text-[15px]">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <Link to={to} className="font-medium text-brand-ink/75 transition-colors hover:text-brand-yellow-dark">
        {children}
      </Link>
    </li>
  );
}

function FooterCard() {
  const { data: categories = [] } = useCategories();
  const { data: settings } = useSiteSettings();

  return (
    <div className="w-full max-w-6xl">
      <div className="overflow-hidden rounded-[28px] border border-brand-ink/10 bg-brand-cream shadow-sm sm:rounded-[48px]">
        <div className="m-1.5 rounded-[22px] bg-white p-6 shadow-sm sm:m-2 sm:rounded-[40px] sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <Logo size={44} />
              <p className="max-w-[320px] text-[15px] font-normal leading-relaxed text-neutral-500">
                {STORE.description}
              </p>
              <div className="flex gap-3">
                <a
                  href={STORE.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className={SOCIAL_BUTTON_CLASS}
                >
                  <InstagramIcon size={19} />
                </a>
                <a
                  href={buildWhatsAppLink(settings.whatsappNumber, "Olá! Vim pelo site e quero falar com a loja.")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className={SOCIAL_BUTTON_CLASS}
                >
                  <MessageCircle size={19} />
                </a>
              </div>
            </div>

            <FooterColumn title="Categorias">
              {categories.map((cat) => (
                <FooterLink key={cat.slug} to={`/categoria/${cat.slug}`}>
                  {cat.name}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Institucional">
              <FooterLink to="/politicas/trocas-e-devolucoes">Trocas e devoluções</FooterLink>
              <FooterLink to="/politicas/privacidade">Política de privacidade</FooterLink>
              <FooterLink to="/politicas/entrega">Prazos de entrega</FooterLink>
              <FooterLink to="/sobre">Sobre a loja</FooterLink>
            </FooterColumn>

            <div className="flex flex-col gap-5">
              <h3 className="font-display text-xs tracking-[0.3em] text-neutral-400">Contato</h3>
              <ul className="flex flex-col gap-3.5 text-[15px] font-medium text-brand-ink/75">
                <li className="flex items-start gap-2.5">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-brand-yellow-dark" />
                  <span>
                    {STORE.address.street}
                    <br />
                    {STORE.address.city} - {STORE.address.state}
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <MessageCircle size={16} className="shrink-0 text-brand-yellow-dark" />
                  <span>{formatWhatsAppDisplay(settings.whatsappNumber)}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail size={16} className="shrink-0 text-brand-yellow-dark" />
                  <span className="break-all">{settings.contactEmail}</span>
                </li>
              </ul>
              <ul className="flex flex-col gap-1 text-xs text-neutral-400">
                {STORE.hours.map((h) => (
                  <li key={h.label}>
                    {h.label}: {h.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-5 text-center text-sm sm:flex-row sm:justify-between sm:px-10 sm:text-left lg:px-12">
          <p className="font-medium text-neutral-500">
            © {new Date().getFullYear()} {STORE.name}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 font-medium text-neutral-500 sm:gap-6">
            <Link to="/politicas/privacidade" className="transition-colors hover:text-brand-ink">
              Política de privacidade
            </Link>
            <div className="h-4 w-px bg-brand-ink/10" aria-hidden />
            <span>
              {STORE.address.city} - {STORE.address.state}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Palavra gigante mesclada ao fundo da página (mesma cor do bg-brand-cream
 * do <body>), com um filtro SVG artesanal que desenha um relevo de vidro
 * (sombra externa + realce/entalhe internos) por cima — sem esse filtro o
 * texto ficaria literalmente invisível; com ele, aparece como um relevo
 * sutil, só perceptível de perto ou com a luz certa.
 */
function GlassText() {
  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden pb-2 pt-10 sm:pt-14">
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="footer-glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0a0a0a" floodOpacity="0.1" result="outer-shadow" />
            <feComponentTransfer in="SourceAlpha" result="alpha">
              <feFuncA type="linear" slope="1" />
            </feComponentTransfer>
            <feOffset in="alpha" dx="0" dy="4" result="offset-white" />
            <feGaussianBlur in="offset-white" stdDeviation="4" result="blur-white" />
            <feComposite in="alpha" in2="blur-white" operator="out" result="inner-white-mask" />
            <feFlood floodColor="#ffffff" floodOpacity="0.7" result="white-fill" />
            <feComposite in="white-fill" in2="inner-white-mask" operator="in" result="inner-white-final" />
            <feGaussianBlur in="alpha" stdDeviation="6" result="blur-black" />
            <feComposite in="alpha" in2="blur-black" operator="out" result="inner-black-mask" />
            <feFlood floodColor="#0a0a0a" floodOpacity="0.12" result="black-fill" />
            <feComposite in="black-fill" in2="inner-black-mask" operator="in" result="inner-black-final" />
            <feMerge>
              <feMergeNode in="outer-shadow" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="inner-white-final" />
              <feMergeNode in="inner-black-final" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <h2
          aria-hidden="true"
          className="select-none whitespace-nowrap px-4 font-display text-[min(20vw,220px)] leading-none tracking-wide text-brand-cream"
          style={{ filter: "url(#footer-glass-effect)" }}
        >
          INOVAÇÃO
        </h2>
      </motion.div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="flex w-full flex-col items-center gap-0 pt-16 sm:pt-20">
      <div className="container-page flex justify-center">
        <FooterCard />
      </div>
      <GlassText />
    </footer>
  );
}
