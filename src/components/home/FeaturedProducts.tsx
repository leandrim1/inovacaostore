import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { ProductCard } from "../product/ProductCard";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

export function FeaturedProducts() {
  const { data: products = [] } = useProducts({ featured: true, limit: 8 });

  if (products.length === 0) return null;

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading
          index="02"
          eyebrow="Selecionados"
          title="Em destaque"
          description="As peças mais desejadas da temporada, escolhidas a dedo para você."
          action={
            <Link
              to="/categoria/camisetas"
              className="group flex items-center gap-1.5 font-display text-sm tracking-widest text-brand-ink hover:text-brand-yellow-dark"
            >
              Ver tudo
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          }
        />

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
