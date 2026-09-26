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

  // Faixa escura e compacta, como a ficha de serviço da loja: ícone pequeno
  // ao lado do título, texto curto embaixo, réguas separando. Informação de
  // apoio — não disputa atenção com os produtos logo acima.
  return (
    <section data-cabecalho-escuro className="bg-brand-ink text-white">
      <div
        className={`container-page grid grid-cols-2 lg:grid-cols-4 ${carregando ? "invisible" : ""}`}
      >
        {benefits.map((b, i) => {
          const Icon = benefitIcon(b.icon);
          return (
            <div
              key={i}
              className={`min-w-0 border-white/10 py-6 sm:py-8 ${i % 2 === 1 ? "border-l pl-4 sm:pl-6" : "pr-4 sm:pr-6"} ${
                i >= 2 ? "border-t lg:border-t-0" : ""
              } lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0`}
            >
              <h3 className="flex items-center gap-2 break-words font-display text-lg leading-none tracking-[0.02em]">
                <Icon size={17} strokeWidth={1.75} className="shrink-0 text-brand-yellow" aria-hidden />
                {b.title}
              </h3>
              <p className="mt-2 break-words text-[13px] leading-snug text-white/60">{b.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
