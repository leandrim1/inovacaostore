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
      <div className="absolute inset-0 bg-black/65" />

      <div className="container-page relative z-10 grid gap-10 sm:grid-cols-2 sm:items-center sm:gap-16">
        <Reveal>
          <p className="rotulo text-white/55">Fique por dentro</p>
          <h2 className="mt-3 font-display text-[clamp(2.6rem,10vw,4.75rem)] leading-[0.86] text-white">
            Ofertas exclusivas no seu e-mail
          </h2>
          <p className="mt-4 max-w-md text-white/65">
            Cadastre-se e receba lançamentos, promoções e cupons exclusivos em primeira mão.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          {submitted ? (
            <p className="w-fit border border-white/25 px-5 py-4 text-sm font-medium text-white">
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
                className="min-h-12 w-full flex-1 rounded-[3px] border border-white/25 bg-black/40 px-4 text-[15px] text-white outline-none placeholder:text-white/50 focus:border-white"
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
