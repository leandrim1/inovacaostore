import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import heroImageFallback from "../../assets/images/hero-friends.jpg";
import { useParallax } from "../../hooks/useParallax";
import { useSiteSettings } from "../../hooks/useSiteSettings";

export function Hero() {
  const { ref, offset } = useParallax(0.15);
  const { data: settings } = useSiteSettings();

  const heroImage = settings.heroImageUrl || heroImageFallback;
  const isExternalCta = /^https?:\/\//.test(settings.heroCtaUrl);

  return (
    <section className="relative flex min-h-[78vh] items-end overflow-hidden bg-brand-ink sm:min-h-[88vh]">
      <div ref={ref} className="absolute inset-0" aria-hidden>
        <img
          src={heroImage}
          alt="Amigos vestindo peças da Inovação Store"
          className="h-[120%] w-full scale-110 object-cover object-[center_65%] opacity-90"
          style={{ transform: `translateY(${offset}px) scale(1.1)` }}
          fetchPriority="high"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

      <div className="container-page relative z-10 pb-14 pt-32 sm:pb-20">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-3 font-display text-sm tracking-[0.35em] text-brand-yellow"
        >
          {settings.heroEyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-xl text-5xl leading-[0.95] text-white sm:text-6xl lg:text-7xl"
        >
          {settings.heroTitle.split("\n").map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-5 max-w-md text-base text-white/80 sm:text-lg"
        >
          {settings.heroDescription}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-8"
        >
          {isExternalCta ? (
            <a href={settings.heroCtaUrl} target="_blank" rel="noreferrer" className="btn-accent">
              {settings.heroCtaLabel}
              <ArrowRight size={16} />
            </a>
          ) : (
            <Link to={settings.heroCtaUrl} className="btn-accent">
              {settings.heroCtaLabel}
              <ArrowRight size={16} />
            </Link>
          )}
        </motion.div>
      </div>

      <a
        href="#categorias"
        aria-label="Rolar para baixo"
        className="absolute inset-x-0 bottom-5 z-10 mx-auto hidden w-fit animate-bounce-slow place-items-center text-white/70 transition-colors hover:text-brand-yellow motion-reduce:animate-none sm:grid"
      >
        <ChevronDown size={26} aria-hidden />
      </a>
    </section>
  );
}
