import { Truck, RefreshCw, ShieldCheck, Headset } from "lucide-react";

const ITEMS = [
  { icon: Truck, label: "Frete grátis acima de R$ 299" },
  { icon: RefreshCw, label: "Troca fácil em até 30 dias" },
  { icon: ShieldCheck, label: "Pagamento 100% seguro" },
  { icon: Headset, label: "Atendimento rápido pelo WhatsApp" },
];

export function AnnouncementBar() {
  const track = [...ITEMS, ...ITEMS];

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
