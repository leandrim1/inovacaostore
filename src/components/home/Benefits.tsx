import { Reveal } from "../ui/Reveal";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { benefitIcon } from "../../lib/benefitIcons";

export function Benefits() {
  // Textos e ícones vêm do painel (Configurações → Benefícios).
  //
  // `isPlaceholderData`: as configurações ainda não chegaram e `settings` são
  // os padrões do código. A faixa fica invisível (mas ocupando o espaço, sem
  // pular a página) em vez de mostrar por um instante um texto que o lojista
  // já trocou — o mesmo cuidado que o hero tem com a imagem.
  const { data: settings, isPlaceholderData: carregando } = useSiteSettings();
  const benefits = [
    { icon: settings.benefit1Icon, title: settings.benefit1Title, description: settings.benefit1Text },
    { icon: settings.benefit2Icon, title: settings.benefit2Title, description: settings.benefit2Text },
    { icon: settings.benefit3Icon, title: settings.benefit3Title, description: settings.benefit3Text },
    { icon: settings.benefit4Icon, title: settings.benefit4Title, description: settings.benefit4Text },
  ];

  return (
    <section className="border-y border-brand-ink/10 bg-brand-cream py-12 sm:py-16">
      <div
        className={`container-page grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:divide-x lg:divide-brand-ink/10 ${
          carregando ? "invisible" : ""
        }`}
      >
        {benefits.map((b, i) => {
          const Icon = benefitIcon(b.icon);
          return (
            <Reveal key={i} delay={i * 0.05} className="min-w-0">
              <div className="group flex flex-col items-center gap-2.5 text-center lg:items-start lg:px-6 lg:text-left lg:first:pl-0">
                <div className="flex items-center gap-3">
                  {/* Ícone em "tecla" de relevo: luz de cima, sombra embaixo — e
                      no hover ela gira em perspectiva e sobe da superfície. */}
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-b from-white to-neutral-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-2px_0_rgba(10,10,10,0.06),0_12px_20px_-12px_rgba(10,10,10,0.45),0_2px_4px_-2px_rgba(10,10,10,0.18)] ring-1 ring-brand-ink/10 transition-transform duration-500 ease-out group-hover:[transform:perspective(420px)_rotateX(14deg)_rotateY(-14deg)_translateY(-3px)] motion-reduce:transition-none motion-reduce:group-hover:[transform:none]">
                    <Icon size={20} strokeWidth={1.75} className="text-brand-yellow-dark drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]" />
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-neutral-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="break-words font-display text-base tracking-wide text-brand-ink">{b.title}</h3>
                <p className="break-words text-sm leading-relaxed text-neutral-500">{b.description}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
