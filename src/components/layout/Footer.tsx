import { Link } from "react-router-dom";
import { MessageCircle, Mail, MapPin } from "lucide-react";
import { Logo } from "../ui/Logo";
import { InstagramIcon } from "../ui/InstagramIcon";
import { STORE, buildWhatsAppLink } from "../../data/store";
import { useCategories } from "../../hooks/useCategories";

export function Footer() {
  const { data: categories = [] } = useCategories();

  return (
    <footer className="mt-20 bg-brand-ink text-white">
      <div className="container-page grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm text-white/60">{STORE.description}</p>
          <div className="flex gap-3 pt-1">
            <a
              href={STORE.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-brand-yellow hover:text-brand-yellow"
            >
              <InstagramIcon size={18} />
            </a>
            <a
              href={buildWhatsAppLink("Olá! Vim pelo site e quero falar com a loja.")}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-brand-yellow hover:text-brand-yellow"
            >
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-display mb-4 text-sm tracking-widest text-white/50">
            Categorias
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link to={`/categoria/${cat.slug}`} className="text-white/80 hover:text-brand-yellow">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display mb-4 text-sm tracking-widest text-white/50">
            Institucional
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link to="/politicas/trocas-e-devolucoes" className="text-white/80 hover:text-brand-yellow">
                Trocas e devoluções
              </Link>
            </li>
            <li>
              <Link to="/politicas/privacidade" className="text-white/80 hover:text-brand-yellow">
                Política de privacidade
              </Link>
            </li>
            <li>
              <Link to="/politicas/entrega" className="text-white/80 hover:text-brand-yellow">
                Prazos de entrega
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="text-white/80 hover:text-brand-yellow">
                Sobre a loja
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display mb-4 text-sm tracking-widest text-white/50">
            Contato
          </h3>
          <ul className="flex flex-col gap-3 text-sm text-white/80">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-brand-yellow" />
              <span>
                {STORE.address.street}
                <br />
                {STORE.address.city} - {STORE.address.state}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle size={16} className="shrink-0 text-brand-yellow" />
              <span>{STORE.contact.whatsappDisplay}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0 text-brand-yellow" />
              <span>{STORE.contact.email}</span>
            </li>
          </ul>
          <ul className="mt-4 flex flex-col gap-1 text-xs text-white/50">
            {STORE.hours.map((h) => (
              <li key={h.label}>
                {h.label}: {h.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-center text-xs text-white/40 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} {STORE.name}. Todos os direitos reservados.
          </p>
          <p>{STORE.address.city} - {STORE.address.state}</p>
        </div>
      </div>
    </footer>
  );
}
