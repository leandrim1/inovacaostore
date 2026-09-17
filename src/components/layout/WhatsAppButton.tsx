import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "../../data/store";
import { useSiteSettings } from "../../hooks/useSiteSettings";

export function WhatsAppButton() {
  const { data: settings } = useSiteSettings();

  return (
    <motion.a
      href={buildWhatsAppLink(settings.whatsappNumber, settings.whatsappMessage)}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg sm:bottom-6 sm:right-6"
    >
      <span
        className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-[#25D366] motion-reduce:animate-none"
        aria-hidden
      />
      <MessageCircle size={26} fill="white" className="text-[#25D366]" />
    </motion.a>
  );
}
