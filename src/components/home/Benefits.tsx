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
              <div className="flex flex-col items-center gap-2.5 text-center lg:items-start lg:px-6 lg:text-left lg:first:pl-0">
                <div className="flex items-center gap-2.5">
                  <Icon size={20} strokeWidth={1.75} className="text-brand-yellow-dark" />
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
