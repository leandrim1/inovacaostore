import { MapPin, MessageCircle, Clock } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import {
  STORE,
  buildMapsLink,
  buildWhatsAppLink,
  formatStoreAddress,
  formatWhatsAppDisplay,
} from "../data/store";
import { InstagramIcon } from "../components/ui/InstagramIcon";
import { useSiteSettings } from "../hooks/useSiteSettings";
import heroImage from "../assets/images/hero-friends.jpg";

export default function AboutPage() {
  const { data: settings } = useSiteSettings();
  const mapQuery = encodeURIComponent(
    `${STORE.address.street}, ${STORE.address.city} - ${STORE.address.state}`,
  );

  return (
    <>
      <Seo
        title="Sobre a loja"
        description={`Conheça a ${STORE.name}, loja de roupas masculinas nacionais e importadas em ${STORE.address.city} - ${STORE.address.state}.`}
      />
      <div className="relative h-64 overflow-hidden sm:h-80">
        <img src={heroImage} alt="Equipe Inovação Store" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="container-page absolute inset-0 flex flex-col justify-end pb-8 text-white">
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">Sobre a loja</h1>
        </div>
      </div>

      <div className="container-page grid grid-cols-1 gap-12 py-14 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-lg leading-relaxed text-neutral-700">
            A <strong>{STORE.name}</strong> nasceu com o propósito de trazer moda
            masculina de qualidade para {STORE.address.city}, unindo peças
            nacionais e importadas com estilo urbano, sofisticado e acessível.
          </p>
          <p className="mt-4 leading-relaxed text-neutral-600">
            Selecionamos cuidadosamente camisetas, camisas, calças, bermudas,
            jaquetas e acessórios para quem busca se vestir bem sem abrir mão
            de conforto e autenticidade. Nossa loja física fica no coração de
            Patos de Minas, mas atendemos clientes de todo o Brasil através da
            nossa loja online.
          </p>
          <p className="mt-4 leading-relaxed text-neutral-600">
            Além do site, estamos sempre disponíveis pelo WhatsApp e Instagram
            para tirar dúvidas, indicar tamanhos e ajudar você a montar o look
            perfeito.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-brand-ink/10 bg-brand-cream p-6">
          <a
            href={buildMapsLink()}
            target="_blank"
            rel="noreferrer"
            aria-label={`Ver no Google Maps: ${formatStoreAddress()}`}
            className="flex items-start gap-3 transition-colors hover:text-brand-yellow-dark"
          >
            <MapPin size={20} className="mt-0.5 shrink-0 text-brand-yellow-dark" />
            <div>
              <p className="font-medium text-brand-ink">Endereço</p>
              <p className="text-sm text-neutral-600">
                {STORE.address.street}
                <br />
                {STORE.address.city} - {STORE.address.state}
              </p>
            </div>
          </a>
          <div className="flex items-start gap-3">
            <Clock size={20} className="mt-0.5 shrink-0 text-brand-yellow-dark" />
            <div>
              <p className="font-medium text-brand-ink">Horário</p>
              {STORE.hours.map((h) => (
                <p key={h.label} className="text-sm text-neutral-600">
                  {h.label}: {h.value}
                </p>
              ))}
            </div>
          </div>
          <a
            href={buildWhatsAppLink(settings.whatsappNumber, "Olá! Vim pelo site e quero saber mais sobre a loja.")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 text-sm font-medium text-green-700"
          >
            <MessageCircle size={16} /> {formatWhatsAppDisplay(settings.whatsappNumber)}
          </a>
          <a
            href={STORE.social.instagram}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 text-sm font-medium text-brand-ink"
          >
            <InstagramIcon size={20} /> {STORE.social.instagramHandle}
          </a>
        </div>
      </div>

      <div className="h-80 w-full sm:h-96">
        <iframe
          title="Localização da loja no mapa"
          src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </>
  );
}
