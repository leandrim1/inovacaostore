import { Quote } from "lucide-react";
import { TESTIMONIALS, AVERAGE_RATING } from "../../data/testimonials";
import { StarRating } from "../ui/StarRating";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

export function Testimonials() {
  const [spotlight, ...rest] = TESTIMONIALS;

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading
          index="03"
          eyebrow="Depoimentos"
          title="O que dizem nossos clientes"
          description="Histórias reais de quem já veste Inovação Store."
          action={
            <div className="flex items-center gap-3 rounded-lg border border-brand-ink/10 px-4 py-2.5">
              <StarRating rating={AVERAGE_RATING} size={14} />
              <span className="font-display text-sm text-brand-ink">
                {AVERAGE_RATING.toFixed(1).replace(".", ",")}
              </span>
            </div>
          }
        />

        <div className="space-y-4">
          {spotlight && (
            <Reveal>
              <figure className="grid gap-5 rounded-2xl bg-brand-ink p-8 text-white sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-10">
                <Quote size={48} className="shrink-0 text-brand-yellow" aria-hidden />
                <div>
                  <blockquote className="text-xl leading-snug sm:text-2xl">“{spotlight.quote}”</blockquote>
                  <figcaption className="mt-5 flex flex-wrap items-center gap-3">
                    <StarRating rating={spotlight.rating} size={14} />
                    <span className="text-sm font-semibold">{spotlight.name}</span>
                    <span className="text-sm text-white/50">{spotlight.city}</span>
                  </figcaption>
                </div>
              </figure>
            </Reveal>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {rest.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.05}>
                <figure className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-brand-ink/10 p-6">
                  <div>
                    <Quote size={22} className="text-brand-yellow-dark" aria-hidden />
                    <blockquote className="mt-3 text-sm leading-relaxed text-neutral-700">
                      “{t.quote}”
                    </blockquote>
                  </div>
                  <figcaption>
                    <StarRating rating={t.rating} size={12} />
                    <p className="mt-2 text-sm font-semibold text-brand-ink">{t.name}</p>
                    <p className="text-xs text-neutral-400">{t.city}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
