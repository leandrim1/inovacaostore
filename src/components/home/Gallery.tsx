import { useEffect, useRef, useState } from "react";
import { useSiteSettings, type HeroImage } from "../../hooks/useSiteSettings";
import { SectionHeading } from "../ui/SectionHeading";

/** Repete a fileira até ter fotos suficientes para nunca faltar conteúdo
 * durante o deslocamento pela rolagem, mesmo com poucas fotos cadastradas. */
function repeatToFill(images: HeroImage[], minCount = 12, maxRepeats = 8) {
  if (images.length === 0) return [];
  const repeats = Math.min(maxRepeats, Math.max(3, Math.ceil(minCount / images.length)));
  return Array.from({ length: repeats }, () => images).flat();
}

export function Gallery() {
  const { data: settings } = useSiteSettings();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  const images = settings.galleryImages;
  const mid = Math.ceil(images.length / 2);
  const row1 = repeatToFill(images.slice(0, mid));
  const row2 = repeatToFill(images.slice(mid));

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let ticking = false;
    function update() {
      const section = sectionRef.current;
      if (!section) {
        ticking = false;
        return;
      }
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      setOffset((window.scrollY - sectionTop + window.innerHeight) * 0.25);
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (images.length === 0) return null;

  return (
    <section ref={sectionRef} className="overflow-hidden bg-white py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading
          index="04"
          eyebrow="Bastidores"
          title="Nossa loja"
          description="Peças, ambiente e marcas que trabalhamos — de perto."
        />
      </div>

      <div className="no-scrollbar overflow-hidden" aria-hidden>
        <div className="flex flex-col gap-3 sm:gap-4">
          {row1.length > 0 && (
            <div
              className="flex gap-3 sm:gap-4"
              style={{ transform: `translateX(${offset - 200}px)`, willChange: "transform" }}
            >
              {row1.map((img, i) => (
                <div
                  key={`row1-${img.id}-${i}`}
                  className="h-40 w-60 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-52 sm:w-80 md:h-[220px] md:w-[340px]"
                >
                  <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {row2.length > 0 && (
            <div
              className="flex gap-3 sm:gap-4"
              style={{ transform: `translateX(${-(offset - 200)}px)`, willChange: "transform" }}
            >
              {row2.map((img, i) => (
                <div
                  key={`row2-${img.id}-${i}`}
                  className="h-40 w-60 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-52 sm:w-80 md:h-[220px] md:w-[340px]"
                >
                  <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
