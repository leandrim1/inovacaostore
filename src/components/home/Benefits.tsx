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
    <section className="border-y border-black/5 bg-brand-cream py-12 sm:py-16">
      <div className="container-page grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
        {BENEFITS.map((b, i) => (
          <Reveal key={b.title} delay={i * 0.05}>
            <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-ink text-brand-yellow">
                <b.icon size={22} />
              </div>
              <div>
                <h3 className="font-display text-base tracking-wide">{b.title}</h3>
                <p className="mt-1 text-sm text-neutral-500">{b.description}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
