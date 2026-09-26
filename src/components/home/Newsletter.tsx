import { useState } from "react";
import { Send } from "lucide-react";
import { Reveal } from "../ui/Reveal";
import newsletterBg from "../../assets/images/otimizadas/newsletter-bg.webp";

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
    <section data-cabecalho-escuro className="relative min-h-[420px] overflow-hidden bg-brand-ink py-16 text-white sm:min-h-[460px] sm:py-24">
      {/* Fica no rodapé de uma página de ~7.400 px e carregava junto com o
          resto: 251 KB gastos antes de o visitante rolar. A altura mínima da
          seção já reserva o espaço, então adiar não desloca nada na tela. */}
      <img
        src={newsletterBg}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[38%_center] sm:object-[50%_40%]"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="container-page relative z-10 grid gap-10 sm:grid-cols-2 sm:items-center sm:gap-16">
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
                className="w-full flex-1 border border-white/20 bg-black/30 px-5 py-3.5 text-sm text-white outline-none placeholder:text-white/50 focus:border-brand-yellow"
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
