import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useCreateTestimonial } from "../../hooks/useTestimonials";

const MAX_QUOTE = 500;

export function TestimonialFormModal({
  isOpen,
  onClose,
  suggestedName,
}: {
  isOpen: boolean;
  onClose: () => void;
  suggestedName: string | null;
}) {
  const [name, setName] = useState(suggestedName ?? "");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [quote, setQuote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const createTestimonial = useCreateTestimonial();

  useBodyScrollLock(isOpen);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createTestimonial.mutateAsync({
        name: name.trim() || undefined,
        city: city.trim() || undefined,
        rating,
        quote: quote.trim(),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar seu depoimento.");
    }
  }

  const displayedRating = hoverRating || rating;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Deixe seu depoimento"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-brand-ink/10 px-5 py-4">
              <h2 className="font-display text-sm tracking-widest text-neutral-500">
                DEIXE SEU DEPOIMENTO
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-ink"
              >
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div className="flex flex-col gap-4 px-5 py-8 text-center">
                <p className="font-display text-xl tracking-wide text-brand-ink">Obrigado!</p>
                <p className="text-sm text-neutral-500">
                  Seu depoimento foi enviado e aparece na loja assim que for aprovado.
                </p>
                <button type="button" onClick={onClose} className="btn-primary mt-2">
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
                <div>
                  <p className="mb-2 text-xs font-medium text-neutral-500">Sua nota</p>
                  <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHoverRating(value)}
                        aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
                        aria-pressed={rating === value}
                        className="rounded p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          size={28}
                          className={
                            value <= displayedRating
                              ? "fill-brand-yellow text-brand-yellow"
                              : "fill-neutral-200 text-neutral-200"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <label className="text-xs font-medium text-neutral-500">
                  Como seu nome aparece na loja
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    placeholder="Seu nome"
                    className="input-field mt-1 w-full"
                  />
                </label>

                <label className="text-xs font-medium text-neutral-500">
                  Cidade (opcional)
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    maxLength={60}
                    placeholder="Ex: Patos de Minas, MG"
                    className="input-field mt-1 w-full"
                  />
                </label>

                <label className="text-xs font-medium text-neutral-500">
                  Seu depoimento
                  <textarea
                    required
                    value={quote}
                    onChange={(e) => setQuote(e.target.value.slice(0, MAX_QUOTE))}
                    rows={5}
                    minLength={20}
                    placeholder="Conte como foi sua experiência com a loja, o produto e o atendimento."
                    className="input-field mt-1 w-full resize-none"
                  />
                  <span className="mt-1 block text-right text-[11px] text-neutral-400">
                    {quote.length}/{MAX_QUOTE}
                  </span>
                </label>

                {error && <p className="alert-error">{error}</p>}

                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Seu depoimento passa por aprovação da loja antes de aparecer no site.
                </p>

                <button
                  type="submit"
                  disabled={createTestimonial.isPending}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {createTestimonial.isPending ? "Enviando…" : "Enviar depoimento"}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
