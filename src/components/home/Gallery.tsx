import { useSiteSettings, type HeroImage } from "../../hooks/useSiteSettings";

/** Repete a fileira 6x para a trilha do marquee em loop contínuo (CSS puro).
 * O deslocamento de -16.6667% (1/6) cai exatamente no fim de uma repetição,
 * então o espaçamento entre logos vai como margem em cada item (não como
 * `gap` do flex) — do contrário a trilha "pula" no ponto em que o loop reinicia. */
const TRACK_REPEATS = 6;

function buildTrack(images: HeroImage[]) {
  if (images.length === 0) return [];
  return Array.from({ length: TRACK_REPEATS }, () => images).flat();
}

/**
 * Faixa das marcas/fotos da galeria da loja: uma fileira só, andando devagar,
 * entre duas réguas. Informação de apoio — por isso discreta.
 */
export function Gallery() {
  const { data: settings } = useSiteSettings();

  const images = settings.galleryImages;
  const trilha = buildTrack(images);

  if (images.length === 0) return null;

  return (
    <section className="overflow-hidden border-b border-brand-ink/10 bg-white py-6 sm:py-8">
      <div className="no-scrollbar overflow-hidden" aria-hidden>
        <div className="flex w-max animate-marquee motion-reduce:animate-none">
          {trilha.map((img, i) => (
            <div
              key={`${img.id}-${i}`}
              className="mr-6 flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden p-2 sm:mr-10 sm:h-16 sm:w-36"
            >
              <img src={img.url} alt="" loading="lazy" className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
