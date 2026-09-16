import { useState } from "react";
import { Send } from "lucide-react";
import { Reveal } from "../ui/Reveal";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <section className="bg-brand-ink py-16 text-white sm:py-20">
      <div className="container-page flex flex-col items-center text-center">
        <Reveal>
          <h2 className="section-title mb-3 text-white">
            Ofertas exclusivas no seu e-mail
          </h2>
          <p className="mb-8 max-w-md text-white/60">
            Cadastre-se e receba lançamentos, promoções e cupons exclusivos em
            primeira mão.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="w-full max-w-md">
          {submitted ? (
            <p className="rounded-full bg-brand-yellow px-6 py-3 font-display text-sm tracking-widest text-brand-ink">
              Cadastro realizado com sucesso!
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                className="w-full flex-1 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-yellow"
              />
              <button type="submit" className="btn-accent shrink-0">
                Quero receber
                <Send size={15} />
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
