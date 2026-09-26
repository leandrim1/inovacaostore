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
 * "Em destaque": as peças que a loja escolheu, sem palco nem efeito — aqui o
 * produto é o assunto. No celular passam numa faixa que o dedo arrasta (com
 * a próxima peça aparecendo na borda, o convite para deslizar); no
 * computador, a grade de catálogo.
 */
export function FeaturedProducts() {
  const { data: products = [] } = useProducts({ featured: true, limit: 8 });
  const movel = useIsMobileViewport();

  if (products.length === 0) return null;

  const verTudo = (
    <Link
      to="/destaques"
      className="group flex min-h-11 items-center gap-1.5 whitespace-nowrap text-sm font-medium text-brand-ink underline-offset-4 hover:underline"
    >
      Ver tudo
      <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );

  return (
    <AnimatedSection tom="claro" className="py-14 sm:py-20">
      <div className="container-page">
        <SectionHeading
          title="Em destaque"
          description="As peças mais desejadas da temporada, escolhidas a dedo para você."
          action={verTudo}
          className="!mb-6 sm:!mb-12"
        />
      </div>

      {movel ? (
        <MobileProductCarousel produtos={products} />
      ) : (
        <div className="container-page">
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {products.map((product, i) => (
              <Reveal key={product.id} delay={(i % 4) * 0.04}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </AnimatedSection>
  );
}
