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

export function Gallery() {
  const { data: settings } = useSiteSettings();

  const images = settings.galleryImages;
  const mid = Math.ceil(images.length / 2);
  const row1 = buildTrack(images.slice(0, mid));
  const row2 = buildTrack(images.slice(mid));

  if (images.length === 0) return null;

  return (
    <section className="overflow-hidden bg-white py-10 sm:py-14">
      <div className="no-scrollbar overflow-hidden" aria-hidden>
        <div className="flex flex-col gap-3 sm:gap-4">
          {row1.length > 0 && (
            <div className="flex w-max animate-marquee motion-reduce:animate-none">
              {row1.map((img, i) => (
                <div
                  key={`row1-${img.id}-${i}`}
                  className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden p-3 mr-3 sm:h-20 sm:w-36 sm:mr-4 md:h-24 md:w-44"
                >
                  <img src={img.url} alt="" loading="lazy" className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          )}

          {row2.length > 0 && (
            <div className="flex w-max animate-marquee-reverse motion-reduce:animate-none">
              {row2.map((img, i) => (
                <div
                  key={`row2-${img.id}-${i}`}
                  className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden p-3 mr-3 sm:h-20 sm:w-36 sm:mr-4 md:h-24 md:w-44"
                >
                  <img src={img.url} alt="" loading="lazy" className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
