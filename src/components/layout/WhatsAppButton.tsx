import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "../../data/store";

export function WhatsAppButton() {
  return (
    <a
      href={buildWhatsAppLink("Olá! Vim pelo site da Inovação Store e gostaria de mais informações.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <MessageCircle size={26} fill="white" className="text-[#25D366]" />
    </a>
  );
}
