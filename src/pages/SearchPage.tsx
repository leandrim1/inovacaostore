import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Seo } from "../components/seo/Seo";
import { ProductListingLayout } from "../components/product/ProductListingLayout";
import { useProducts } from "../hooks/useProducts";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const { data: products = [], isLoading } = useProducts();

  const results = useMemo(() => {
    if (!query) return products;
    const normalized = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(normalized) ||
        p.category.toLowerCase().includes(normalized) ||
        p.description.toLowerCase().includes(normalized),
    );
  }, [products, query]);

  return (
    <>
      <Seo
        title={query ? `Busca por "${query}"` : "Busca"}
        description="Encontre camisetas, camisas, calças, bermudas, jaquetas e acessórios na Inovação Store."
      />
      <ProductListingLayout
        title={query ? `Resultados para "${query}"` : "Todos os produtos"}
        baseProducts={results}
        showCategoryFilter
        isLoading={isLoading}
        emptyMessage={`Nenhum resultado para "${query}". Tente outro termo.`}
      />
    </>
  );
}
