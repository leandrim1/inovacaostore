import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import { useProducts } from "../../hooks/useProducts";
import { PlaceholderImage } from "../ui/PlaceholderImage";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

export function CategoryGrid() {
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();

  return (
    <section id="categorias" className="container-page py-16 sm:py-24">
      <SectionHeading
        index="01"
        eyebrow="Explore"
        title="Categorias"
        description="Nossa seleção completa de peças masculinas nacionais e importadas, organizada por estilo."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:auto-rows-[230px]">
        {categories.map((cat, i) => {
          const featured = i === 0;
          const image = products.find((p) => p.category === cat.slug && p.images[0])?.images[0];

          return (
            <Reveal key={cat.slug} delay={i * 0.05} className={featured ? "col-span-2 lg:row-span-2" : ""}>
              <Link
                to={`/categoria/${cat.slug}`}
                className={`group relative flex h-full w-full flex-col justify-end overflow-hidden bg-neutral-900 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand-yellow after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                  featured ? "aspect-[16/11] sm:aspect-[21/9] lg:aspect-auto" : "aspect-[4/5]"
                }`}
              >
                {image ? (
                  <img
                    src={image}
                    alt={cat.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0">
                    <PlaceholderImage />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

                <div className="relative flex items-end justify-between gap-3 p-4 sm:p-6">
                  <div>
                    <span className="font-mono text-[11px] tabular-nums text-white/45">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3
                      className={`font-display leading-none text-white ${
                        featured ? "mt-1.5 text-3xl sm:text-4xl lg:text-5xl" : "mt-1 text-xl sm:text-2xl"
                      }`}
                    >
                      {cat.name}
                    </h3>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-all duration-300 group-hover:border-brand-yellow group-hover:bg-brand-yellow group-hover:text-brand-ink">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
