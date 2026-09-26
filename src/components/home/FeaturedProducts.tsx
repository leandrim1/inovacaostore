import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";
import { ProductCard } from "../product/ProductCard";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";
import { AnimatedSection } from "../ui/AnimatedSection";
import { MobileProductCarousel } from "../mobile/MobileProductCarousel";

/**
 * "Em destaque" é o palco da loja: fundo escuro com luz de cima e um piso em
 * perspectiva, como a vitrine iluminada de um showroom. No celular os
 * produtos passam num carrossel em perspectiva; no computador viram a grade
 * de sempre, com inclinação sob o mouse.
 */
export function FeaturedProducts() {
  const { data: products = [] } = useProducts({ featured: true, limit: 8 });
  const movel = useIsMobileViewport();

  if (products.length === 0) return null;

  return (
    <AnimatedSection tom="escuro" piso className="py-14 sm:py-24">
      <div className="container-page">
        <SectionHeading
          index="02"
          eyebrow="Selecionados"
          title="Em destaque"
          tone="dark"
          className="!mb-0 sm:!mb-10"
          description="As peças mais desejadas da temporada, escolhidas a dedo para você."
          action={
            <Link
              to="/destaques"
              className="group flex min-h-11 items-center gap-1.5 font-display text-sm tracking-widest text-white hover:text-brand-yellow"
            >
              Ver tudo
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          }
        />
      </div>

      {movel ? (
        <MobileProductCarousel produtos={products} />
      ) : (
        <div className="container-page">
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product, i) => (
              <Reveal key={product.id} delay={(i % 4) * 0.05}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </AnimatedSection>
  );
}
