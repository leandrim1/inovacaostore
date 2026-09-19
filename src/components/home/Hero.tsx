import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import heroImageFallback from "../../assets/images/hero-friends.jpg";
import { useParallax } from "../../hooks/useParallax";
import { useSiteSettings, type HeroImage } from "../../hooks/useSiteSettings";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";
import { useElementAspectRatio } from "../../hooks/useElementAspectRatio";
import { DEFAULT_IMAGE_SETTINGS, totalScale } from "../../lib/imageSettings";
import { StarRating } from "../ui/StarRating";
import { AVERAGE_RATING } from "../../data/testimonials";

const FALLBACK_SLIDE: HeroImage[] = [
  { id: "fallback", url: heroImageFallback, desktopSettings: null, mobileSettings: null },
];
const SLIDE_DURATION = 6000;

export function Hero() {
  const { ref, offset } = useParallax(0.15);
  const aspect = useElementAspectRatio(ref, 16 / 9);
  const { data: settings } = useSiteSettings();
  const [index, setIndex] = useState(0);
  const [prefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const isMobile = useIsMobileViewport();

  const slides = settings.heroImages.length > 0 ? settings.heroImages : FALLBACK_SLIDE;
  const count = slides.length;
  const safeIndex = index < count ? index : 0;
  const isExternalCta = /^https?:\/\//.test(settings.heroCtaUrl);
  const titleLines = settings.heroTitle.split("\n");

  const currentSlide = slides[safeIndex];
  const customSettings = isMobile ? currentSlide.mobileSettings : currentSlide.desktopSettings;
  const effectiveSettings = customSettings ?? DEFAULT_IMAGE_SETTINGS;
  const zoomFactor = totalScale(effectiveSettings, aspect);
  const imgClassName = customSettings
    ? "absolute inset-0 h-full w-full object-cover"
    : isMobile
      ? "absolute inset-0 h-full w-full object-contain object-top"
      : "absolute inset-0 h-[120%] w-full object-cover object-[center_82%]";

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [count]);

  return (
    <section className="relative flex min-h-[92svh] items-end overflow-hidden bg-brand-ink sm:min-h-[95svh] lg:min-h-[90vh]">
      <div ref={ref} className="absolute inset-0" aria-hidden>
        <AnimatePresence>
          <motion.img
            key={currentSlide.id}
            src={currentSlide.url}
            alt="Amigos vestindo peças da Inovação Store"
            initial={{ opacity: 0, scale: (isMobile ? 1 : 1.02) * zoomFactor, rotate: effectiveSettings.rotation }}
            animate={{
              opacity: 0.95,
              scale: (prefersReducedMotion || isMobile ? 1 : 1.18) * zoomFactor,
              rotate: effectiveSettings.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.9, ease: "easeInOut" },
              scale: { duration: SLIDE_DURATION / 1000 + 1.5, ease: "linear" },
            }}
            className={imgClassName}
            style={{
              y: offset,
              ...(customSettings
                ? { objectPosition: `${customSettings.positionX}% ${customSettings.positionY}%` }
                : {}),
            }}
            fetchPriority={safeIndex === 0 ? "high" : undefined}
          />
        </AnimatePresence>
        {/* Duotone + vinheta no lugar do degradê plano — dá profundidade e mantém o texto legível */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_15%_100%,rgba(245,196,0,0.16),transparent_70%)]" />
        <div className="absolute inset-0 [box-shadow:inset_0_0_180px_60px_rgba(0,0,0,0.5)]" />
      </div>

      <div className="container-page relative z-10 pb-16 pt-36 sm:pb-24 sm:pt-40">
        <div className="max-w-3xl border-l-2 border-brand-yellow pl-5 sm:pl-7">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-4 flex items-center gap-2.5"
          >
            <span className="h-px w-8 bg-brand-yellow" aria-hidden />
            <span className="font-display text-xs tracking-[0.4em] text-brand-yellow">
              {settings.heroEyebrow}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-display text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.86] text-white"
          >
            {titleLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-6 max-w-md text-base text-white/75 sm:text-lg"
          >
            {settings.heroDescription}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-9 flex flex-wrap items-center gap-5"
          >
            {isExternalCta ? (
              <a href={settings.heroCtaUrl} target="_blank" rel="noreferrer" className="btn-accent group">
                {settings.heroCtaLabel}
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            ) : (
              <Link to={settings.heroCtaUrl} className="btn-accent group">
                {settings.heroCtaLabel}
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Cartão flutuante de prova social — quebra o limite da foto para dar profundidade */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="absolute bottom-28 right-4 z-10 hidden animate-float items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-md sm:right-6 sm:flex"
      >
        <StarRating rating={AVERAGE_RATING} size={13} />
        <div className="h-8 w-px bg-white/20" aria-hidden />
        <div className="leading-tight">
          <p className="font-display text-sm text-white">{AVERAGE_RATING.toFixed(1).replace(".", ",")} / 5</p>
          <p className="text-[11px] text-white/60">Avaliação dos clientes</p>
        </div>
      </motion.div>

      {count > 1 && (
        <div className="absolute bottom-9 left-1/2 z-10 flex w-40 -translate-x-1/2 items-center gap-1.5 sm:bottom-14 sm:left-7 sm:translate-x-0">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver imagem ${i + 1}`}
              className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"
            >
              {i === safeIndex ? (
                <span
                  key={safeIndex}
                  className="block h-full w-full origin-left animate-[fill-bar_6s_linear] bg-brand-yellow motion-reduce:animate-none"
                />
              ) : i < safeIndex ? (
                <span className="block h-full w-full bg-brand-yellow/70" />
              ) : null}
            </button>
          ))}
        </div>
      )}

      <a
        href="#categorias"
        aria-label="Rolar para baixo"
        className="absolute inset-x-0 bottom-5 z-10 mx-auto hidden w-fit place-items-center text-white/60 transition-colors hover:text-brand-yellow sm:grid"
      >
        <ChevronDown size={20} className="animate-bounce-slow motion-reduce:animate-none" aria-hidden />
      </a>
    </section>
  );
}
