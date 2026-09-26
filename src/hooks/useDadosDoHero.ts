import { useEffect, useState } from "react";
import heroImageFallback from "../assets/images/otimizadas/hero-friends.webp";
import { useSiteSettings, type HeroImage } from "./useSiteSettings";
import { useTestimonials } from "./useTestimonials";

const FALLBACK_SLIDE: HeroImage[] = [
  { id: "fallback", url: heroImageFallback, desktopSettings: null, mobileSettings: null },
];
export const SLIDE_DURATION = 6000;

/**
 * Tudo o que o hero mostra, igual no celular e no computador: textos e
 * imagens do painel, o carrossel das fotos e a nota dos clientes. Os dois
 * layouts só mudam a composição.
 *
 * `carregando` (`isPlaceholderData`): as configurações ainda não chegaram e
 * `settings` são os padrões do código. Nesse intervalo o hero espera em vez
 * de pintar a foto e o título padrão — que o lojista já pode ter trocado.
 */
export function useDadosDoHero() {
  const { data: settings, isPlaceholderData: carregando } = useSiteSettings();
  const { data: testimonials } = useTestimonials();
  const [index, setIndex] = useState(0);

  const slides = settings.heroImages.length > 0 ? settings.heroImages : FALLBACK_SLIDE;
  const count = slides.length;
  const safeIndex = index < count ? index : 0;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [count]);

  return {
    settings,
    carregando,
    slides,
    count,
    safeIndex,
    setIndex,
    currentSlide: slides[safeIndex],
    isExternalCta: /^https?:\/\//.test(settings.heroCtaUrl),
    titleLines: settings.heroTitle.split("\n"),
    averageRating: testimonials?.averageRating ?? null,
  };
}

export type DadosDoHero = ReturnType<typeof useDadosDoHero>;
