import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Mail, MapPin } from "lucide-react";
import { Logo } from "../ui/Logo";
import { InstagramIcon } from "../ui/InstagramIcon";
import { PaymentStrip } from "./PaymentStrip";
import logoImage from "../../assets/images/otimizadas/logo.webp";
import {
  STORE,
  buildMailtoLink,
  buildMapsLink,
  buildWhatsAppLink,
  formatCityState,
  formatStoreAddress,
  formatWhatsAppDisplay,
} from "../../data/store";
import { useCategories } from "../../hooks/useCategories";
import { useSiteSettings } from "../../hooks/useSiteSettings";

const SOCIAL_BUTTON_CLASS =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-ink/10 bg-white text-brand-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:bg-neutral-50 active:scale-95";

// Mesma aparência de antes; o hover amarelo é o que avisa que a linha
// inteira (ícone + texto) agora é clicável. O "py-1 -my-1" aumenta a área
// de toque no celular sem afastar as linhas: a margem negativa devolve ao
// layout exatamente o que o padding tomou.
const CONTACT_LINK_CLASS =
  "-my-1 flex gap-2.5 py-1 transition-colors hover:text-brand-yellow-dark";

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
                <li>
                  <a
                    href={buildMapsLink(settings)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Ver no Google Maps: ${formatStoreAddress(settings)}`}
                    className={`${CONTACT_LINK_CLASS} items-start`}
                  >
                    <MapPin size={16} className="mt-0.5 shrink-0 text-brand-yellow-dark" />
                    <span>
                      {settings.addressStreet}
                      <br />
                      {formatCityState(settings)}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href={buildWhatsAppLink(
                      settings.whatsappNumber,
                      "Olá! Vim pelo site e quero falar com a loja.",
                    )}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Falar no WhatsApp: ${formatWhatsAppDisplay(settings.whatsappNumber)}`}
                    className={`${CONTACT_LINK_CLASS} items-center`}
                  >
                    <MessageCircle size={16} className="shrink-0 text-brand-yellow-dark" />
                    <span>{formatWhatsAppDisplay(settings.whatsappNumber)}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={buildMailtoLink(settings.contactEmail)}
                    aria-label={`Enviar e-mail para ${settings.contactEmail}`}
                    className={`${CONTACT_LINK_CLASS} items-center`}
                  >
                    <Mail size={16} className="shrink-0 text-brand-yellow-dark" />
                    <span className="break-all">{settings.contactEmail}</span>
                  </a>
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

        <PaymentStrip />

        <div className="flex flex-col items-center gap-4 border-t border-brand-ink/[0.07] px-6 py-5 text-center text-sm sm:flex-row sm:justify-between sm:px-10 sm:text-left lg:px-12">
          <p className="font-medium text-neutral-500">
            © {new Date().getFullYear()} {STORE.name}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 font-medium text-neutral-500 sm:gap-6">
            <Link to="/politicas/privacidade" className="transition-colors hover:text-brand-ink">
              Política de privacidade
            </Link>
            <div className="h-4 w-px bg-brand-ink/10" aria-hidden />
            <span>{formatCityState(settings)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Fechamento decorativo do footer: a logo real da loja em tamanho grande,
 * com sombra suave para dar profundidade. Puramente decorativo (o mesmo
 * logo já é acessível lá em cima, dentro do FooterCard), por isso fica
 * fora da árvore de acessibilidade.
 */
function BrandMark() {
  return (
    <div className="flex w-full items-center justify-center overflow-hidden pb-12 pt-10 sm:pb-16 sm:pt-14" aria-hidden="true">
      <motion.img
        src={logoImage}
        alt=""
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="h-[140px] w-[140px] rounded-[28px] object-cover shadow-[0_30px_60px_-15px_rgba(10,10,10,0.25)] ring-1 ring-brand-ink/10 sm:h-[200px] sm:w-[200px] sm:rounded-[36px] lg:h-[240px] lg:w-[240px] lg:rounded-[44px]"
      />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="flex w-full flex-col items-center gap-0 pt-16 sm:pt-20">
      <div className="container-page flex justify-center">
        <FooterCard />
      </div>
      <BrandMark />
    </footer>
  );
}
