import { useSearchParams } from "react-router-dom";
import { Seo } from "../components/seo/Seo";
import { ProductListingLayout } from "../components/product/ProductListingLayout";
import { useProducts } from "../hooks/useProducts";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  // A busca por texto é feita no servidor (nome/descrição) para não precisar
  // baixar o catálogo inteiro a cada busca; os filtros de tamanho/cor/preço
  // continuam sendo aplicados no cliente sobre esse resultado já reduzido.
  const { data: results = [], isLoading } = useProducts(query ? { q: query } : {});

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
