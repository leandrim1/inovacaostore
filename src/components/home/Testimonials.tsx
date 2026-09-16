import { Quote } from "lucide-react";
import { TESTIMONIALS } from "../../data/testimonials";
import { StarRating } from "../ui/StarRating";
import { Reveal } from "../ui/Reveal";

export function Testimonials() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container-page">
        <Reveal>
          <h2 className="section-title mb-2">O que dizem nossos clientes</h2>
          <p className="mb-10 max-w-lg text-neutral-500">
            Depoimentos reais de quem já veste Inovação Store.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.05}>
              <figure className="flex h-full flex-col gap-3 rounded-2xl bg-brand-cream p-6">
                <Quote size={24} className="text-brand-yellow-dark" />
                <StarRating rating={t.rating} />
                <blockquote className="flex-1 text-sm leading-relaxed text-neutral-700">
                  “{t.quote}”
                </blockquote>
                <figcaption className="text-sm">
                  <span className="font-semibold text-brand-ink">{t.name}</span>
                  <span className="block text-xs text-neutral-400">{t.city}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
