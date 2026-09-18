import { Seo } from "../components/seo/Seo";
import { ProductListingLayout } from "../components/product/ProductListingLayout";
import { useProducts } from "../hooks/useProducts";

export default function FeaturedPage() {
  const { data: products = [], isLoading } = useProducts({ featured: true });

  return (
    <>
      <Seo
        title="Em destaque"
        description="As peças mais desejadas da temporada na Inovação Store, escolhidas a dedo para você."
      />
      <ProductListingLayout
        title="Em destaque"
        subtitle="As peças mais desejadas da temporada, escolhidas a dedo para você."
        baseProducts={products}
        showCategoryFilter
        isLoading={isLoading}
        emptyMessage="Nenhum produto em destaque no momento."
      />
    </>
  );
}
