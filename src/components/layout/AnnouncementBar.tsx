import { Truck, RefreshCw, ShieldCheck, Headset } from "lucide-react";
import { useSiteSettings } from "../../hooks/useSiteSettings";

const ICONS = [Truck, RefreshCw, ShieldCheck, Headset];

export function AnnouncementBar() {
  const { data: settings } = useSiteSettings();

  const items = [
    settings.announcementItem1,
    settings.announcementItem2,
    settings.announcementItem3,
    settings.announcementItem4,
  ].map((label, i) => ({ icon: ICONS[i], label }));
  // Repetido 6x (em vez de 2x) para garantir que a trilha sempre seja mais larga
  // que a tela, mesmo com textos curtos ou telas ultra-wide. O espaçamento vai
  // como padding em cada item (não como `gap` do flex): assim o deslocamento de
  // -16.6667% (1/6 da trilha) cai exatamente no fim de um conjunto, sem "pulo"
  // no ponto em que o loop reinicia.
  const track = Array.from({ length: 6 }, () => items).flat();

  return (
    <div className="overflow-hidden bg-brand-ink py-2.5">
      <div className="mask-fade-x flex w-max animate-marquee motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-10">
        {track.map((item, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap pr-10 font-display text-[11px] tracking-[0.2em] text-white/90 sm:text-xs"
          >
            <item.icon size={14} className="text-brand-yellow" aria-hidden />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
