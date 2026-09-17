import { Gem } from "lucide-react";

const WORDS = ["ESTILO", "ATITUDE", "NACIONAL", "IMPORTADO"];

export function BrandStatement() {
  // Repetido 6x (mesma técnica da faixa de anúncios) para o loop ficar
  // matematicamente exato, sem "pulo" no ponto em que reinicia.
  const track = Array.from({ length: 6 }, () => WORDS).flat();

  return (
    <section className="overflow-hidden border-y border-brand-ink/10 bg-brand-cream py-8 sm:py-12">
      <p className="sr-only">Inovação Store: estilo, atitude, peças nacionais e importadas.</p>
      <div
        aria-hidden
        className="mask-fade-x flex w-max animate-marquee items-center motion-reduce:animate-none"
      >
        {track.map((word, i) => (
          <span key={i} className="flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12">
            <span
              className={`font-display text-[clamp(2.5rem,7vw,5rem)] leading-none tracking-wide ${
                i % 2 === 0
                  ? "text-brand-ink"
                  : "text-transparent [-webkit-text-stroke:1.5px_var(--color-brand-ink)]"
              }`}
            >
              {word}
            </span>
            <Gem size={22} className="shrink-0 text-brand-yellow" strokeWidth={1.5} />
          </span>
        ))}
      </div>
    </section>
  );
}
