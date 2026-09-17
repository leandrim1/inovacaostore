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
    <section className="bg-brand-ink py-16 text-white sm:py-24">
      <div className="container-page grid gap-10 sm:grid-cols-2 sm:items-center sm:gap-16">
        <Reveal>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="h-px w-8 bg-brand-yellow" aria-hidden />
            <span className="font-display text-xs tracking-[0.4em] text-brand-yellow">Fique por dentro</span>
          </div>
          <h2 className="section-title text-white">Ofertas exclusivas no seu e-mail</h2>
          <p className="mt-4 max-w-md text-white/60">
            Cadastre-se e receba lançamentos, promoções e cupons exclusivos em primeira mão.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          {submitted ? (
            <p className="w-fit border border-brand-yellow bg-brand-yellow/10 px-6 py-4 font-display text-sm tracking-widest text-brand-yellow">
              Cadastro realizado com sucesso!
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                className="w-full flex-1 border border-white/20 bg-white/5 px-5 py-3.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-yellow"
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
