import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { buildWhatsAppLink } from "../../data/store";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";

export function WhatsAppButton() {
  const { data: settings } = useSiteSettings();
  const { pathname } = useLocation();
  const movel = useIsMobileViewport();
  // No celular, na home, o botão só entra depois do hero: lá em cima ele
  // cobriria o CTA principal. (O WhatsApp continua no menu o tempo todo.)
  const escondeNoHero = movel && pathname === "/";
  const [passouDoHero, setPassouDoHero] = useState(false);

  useEffect(() => {
    if (!escondeNoHero) return;
    const medir = () => setPassouDoHero(window.scrollY > window.innerHeight * 0.75);
    medir();
    window.addEventListener("scroll", medir, { passive: true });
    return () => window.removeEventListener("scroll", medir);
  }, [escondeNoHero]);

  // Na página de produto do celular a barra de compra e o link "Tirar dúvidas
  // pelo WhatsApp" já estão na tela; o botão flutuante só disputaria espaço.
  const visivel = !(movel && pathname.startsWith("/produto/")) && (!escondeNoHero || passouDoHero);

  return (
    <AnimatePresence>
      {visivel && (
        <motion.a
          href={buildWhatsAppLink(settings.whatsappNumber, settings.whatsappMessage)}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar no WhatsApp"
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ duration: 0.4, delay: escondeNoHero ? 0 : 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          // No celular sobe acima da barra inferior (e da barra de compra do produto).
          className="fixed bottom-[calc(var(--barra-inferior)+10px)] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg lg:bottom-6 lg:right-6 lg:h-14 lg:w-14"
        >
          <span
            className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-[#25D366] motion-reduce:animate-none"
            aria-hidden
          />
          <MessageCircle size={24} fill="white" className="text-[#25D366]" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
