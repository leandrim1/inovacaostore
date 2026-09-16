import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Seo } from "../components/seo/Seo";
import { ProductListingLayout } from "../components/product/ProductListingLayout";
import { PRODUCTS } from "../data/products";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";

  const results = useMemo(() => {
    if (!query) return PRODUCTS;
    const normalized = query.toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(normalized) ||
        p.category.toLowerCase().includes(normalized) ||
        p.description.toLowerCase().includes(normalized),
    );
  }, [query]);

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
        emptyMessage={`Nenhum resultado para "${query}". Tente outro termo.`}
      />
    </>
  );
}
