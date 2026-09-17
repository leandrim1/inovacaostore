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
  const track = [...items, ...items];

  return (
    <div className="overflow-hidden bg-brand-ink py-2.5">
      <div className="mask-fade-x flex w-max animate-marquee gap-10 motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center">
        {track.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 whitespace-nowrap font-display text-[11px] tracking-[0.2em] text-white/90 sm:text-xs"
          >
            <item.icon size={14} className="text-brand-yellow" aria-hidden />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
