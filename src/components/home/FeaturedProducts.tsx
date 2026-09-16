import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts } from "../../data/products";
import { ProductCard } from "../product/ProductCard";
import { Reveal } from "../ui/Reveal";

export function FeaturedProducts() {
  const products = getFeaturedProducts(8);

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container-page">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="section-title mb-2">Produtos em destaque</h2>
              <p className="max-w-lg text-neutral-500">
                Selecionamos as peças mais desejadas da temporada para você.
              </p>
            </div>
            <Link
              to="/categoria/camisetas"
              className="flex items-center gap-1.5 font-display text-sm tracking-widest text-brand-ink hover:text-brand-yellow-dark"
            >
              Ver tudo <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={(i % 4) * 0.05}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
