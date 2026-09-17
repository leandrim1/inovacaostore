import { Link } from "react-router-dom";
import { useCategories } from "../../hooks/useCategories";
import { useProducts } from "../../hooks/useProducts";
import { PlaceholderImage } from "../ui/PlaceholderImage";
import { Reveal } from "../ui/Reveal";

export function CategoryGrid() {
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();

  return (
    <section id="categorias" className="container-page py-16 sm:py-24">
      <Reveal>
        <h2 className="section-title mb-2">Categorias</h2>
        <p className="mb-10 max-w-lg text-neutral-500">
          Explore nossa seleção completa de peças masculinas nacionais e
          importadas.
        </p>
      </Reveal>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {categories.map((cat, i) => {
          const image = products.find((p) => p.category === cat.slug && p.images[0])?.images[0];
          return (
            <Reveal key={cat.slug} delay={i * 0.05}>
              <Link
                to={`/categoria/${cat.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-900 sm:aspect-[3/4]"
              >
                {image ? (
                  <img
                    src={image}
                    alt={cat.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <PlaceholderImage />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <h3 className="font-display text-xl tracking-wide text-white sm:text-2xl">
                    {cat.name}
                  </h3>
                  <span className="text-xs text-white/70">Ver produtos →</span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
