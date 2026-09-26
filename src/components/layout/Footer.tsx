import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Mail, MapPin } from "lucide-react";
import { Logo } from "../ui/Logo";
import { InstagramIcon } from "../ui/InstagramIcon";
import { PaymentStrip } from "./PaymentStrip";
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
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-brand-ink/15 text-brand-ink transition-colors hover:bg-brand-ink hover:text-white";

// Mesma aparência de antes; o hover amarelo é o que avisa que a linha
// inteira (ícone + texto) agora é clicável. O "py-1 -my-1" aumenta a área
// de toque no celular sem afastar as linhas: a margem negativa devolve ao
// layout exatamente o que o padding tomou.
const CONTACT_LINK_CLASS =
  "-my-1 flex gap-2.5 py-1 transition-colors hover:text-brand-yellow-dark";

function FooterColumn({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      <h3 className="rotulo text-neutral-500">{title}</h3>
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

function FooterContent() {
  const { data: categories = [] } = useCategories();
  const { data: settings } = useSiteSettings();

  return (
    <div className="container-page">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 pb-10 sm:pb-14 lg:grid-cols-12 lg:gap-x-10">
        <div className="col-span-2 flex flex-col gap-6 lg:col-span-4">
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

        <FooterColumn title="Categorias" className="lg:col-span-2 lg:col-start-6">
          {categories.map((cat) => (
            <FooterLink key={cat.slug} to={`/categoria/${cat.slug}`}>
              {cat.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Institucional" className="lg:col-span-2">
          <FooterLink to="/politicas/trocas-e-devolucoes">Trocas e devoluções</FooterLink>
          <FooterLink to="/politicas/privacidade">Política de privacidade</FooterLink>
          <FooterLink to="/politicas/entrega">Prazos de entrega</FooterLink>
          <FooterLink to="/sobre">Sobre a loja</FooterLink>
        </FooterColumn>

        <div className="col-span-2 flex flex-col gap-5 lg:col-span-3">
          <h3 className="rotulo text-neutral-500">Contato</h3>
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

      <PaymentStrip />

      <div className="flex flex-col gap-3 border-t border-brand-ink/10 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
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
  );
}

/**
 * Rodapé chapado sobre o creme, preso à página por uma régua: marca e
 * contato à esquerda, colunas de links alinhadas à mesma grade de 12 colunas
 * da home, pagamento e copyright embaixo.
 */
export function Footer() {
  return (
    <footer className="border-t border-brand-ink/10 bg-brand-cream pt-12 sm:pt-16">
      <FooterContent />
    </footer>
  );
}
