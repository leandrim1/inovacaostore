import { Truck, RefreshCw, ShieldCheck, Headset } from "lucide-react";
import { Reveal } from "../ui/Reveal";

const BENEFITS = [
  {
    icon: Truck,
    title: "Frete grátis",
    description: "Em compras acima de R$ 299 para todo o Brasil.",
  },
  {
    icon: RefreshCw,
    title: "Troca fácil",
    description: "Até 30 dias para trocar ou devolver sem complicação.",
  },
  {
    icon: ShieldCheck,
    title: "Pagamento seguro",
    description: "Ambiente 100% protegido com múltiplas formas de pagamento.",
  },
  {
    icon: Headset,
    title: "Atendimento rápido",
    description: "Suporte pelo WhatsApp para tirar suas dúvidas na hora.",
  },
];

export function Benefits() {
  return (
    <section className="border-y border-brand-ink/10 bg-brand-cream py-12 sm:py-16">
      <div className="container-page grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:divide-x lg:divide-brand-ink/10">
        {BENEFITS.map((b, i) => (
          <Reveal key={b.title} delay={i * 0.05}>
            <div className="flex flex-col items-center gap-2.5 text-center lg:items-start lg:px-6 lg:text-left lg:first:pl-0">
              <div className="flex items-center gap-2.5">
                <b.icon size={20} strokeWidth={1.75} className="text-brand-yellow-dark" />
                <span className="font-mono text-[11px] tabular-nums text-neutral-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-base tracking-wide text-brand-ink">{b.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-500">{b.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
