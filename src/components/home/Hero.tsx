import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroImage from "../../assets/images/hero-friends.jpg";

export function Hero() {
  return (
    <section className="relative flex min-h-[78vh] items-end overflow-hidden bg-brand-ink sm:min-h-[88vh]">
      <img
        src={heroImage}
        alt="Amigos vestindo peças da Inovação Store"
        className="absolute inset-0 h-full w-full object-cover object-top opacity-90"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

      <div className="container-page relative z-10 pb-14 pt-32 sm:pb-20">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-3 font-display text-sm tracking-[0.35em] text-brand-yellow"
        >
          NACIONAIS &amp; IMPORTADOS
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-xl text-5xl leading-[0.95] text-white sm:text-6xl lg:text-7xl"
        >
          Estilo que
          <br />
          fala por você
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-5 max-w-md text-base text-white/80 sm:text-lg"
        >
          Peças selecionadas para o homem moderno. Até 30% OFF em itens
          selecionados por tempo limitado.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-8"
        >
          <Link to="/categoria/camisetas" className="btn-accent">
            Comprar agora
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
