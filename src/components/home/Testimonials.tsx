import { useState } from "react";
import { Link } from "react-router-dom";
import { Quote, PenLine } from "lucide-react";
import { useTestimonials, useTestimonialEligibility } from "../../hooks/useTestimonials";
import { StarRating } from "../ui/StarRating";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";
import { TestimonialFormModal } from "./TestimonialFormModal";

/** Explica ao cliente o que falta para ele poder avaliar a loja. */
function SubmitArea({ onOpen }: { onOpen: () => void }) {
  const { data: eligibility } = useTestimonialEligibility();

  if (!eligibility) return null;

  if (eligibility.canSubmit) {
    return (
      <button type="button" onClick={onOpen} className="btn-outline">
        <PenLine size={15} />
        Deixe seu depoimento
      </button>
    );
  }

  const messages: Record<string, React.ReactNode> = {
    nao_logado: (
      <>
        <Link to="/login" className="font-medium text-brand-ink underline">
          Entre na sua conta
        </Link>{" "}
        para avaliar a loja.
      </>
    ),
    email_nao_verificado: "Confirme seu e-mail para poder avaliar a loja.",
    sem_pedido_entregue: "Assim que um pedido seu for entregue, você poderá deixar seu depoimento.",
    ja_enviado: "Seu depoimento foi enviado e está aguardando aprovação.",
    ja_publicado: "Seu depoimento já está publicado aqui. Obrigado!",
  };

  return (
    <p className="text-sm text-neutral-500">{eligibility.reason ? messages[eligibility.reason] : null}</p>
  );
}

export function Testimonials() {
  const { data } = useTestimonials();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: eligibility } = useTestimonialEligibility();

  const testimonials = data?.items ?? [];
  const averageRating = data?.averageRating ?? null;
  const [spotlight, ...rest] = testimonials;

  if (testimonials.length === 0) return null;

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading
          index="03"
          eyebrow="Depoimentos"
          title="O que dizem nossos clientes"
          description="Histórias reais de quem já veste Inovação Store."
          action={
            averageRating !== null ? (
              <div className="flex items-center gap-3 rounded-lg border border-brand-ink/10 px-4 py-2.5">
                <StarRating rating={averageRating} size={14} />
                <span className="font-display text-sm text-brand-ink">
                  {averageRating.toFixed(1).replace(".", ",")}
                </span>
              </div>
            ) : undefined
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

          {rest.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {rest.slice(0, 3).map((t, i) => (
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
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <SubmitArea onOpen={() => setIsFormOpen(true)} />
        </div>
      </div>

      <TestimonialFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        suggestedName={eligibility?.suggestedName ?? null}
      />
    </section>
  );
}
