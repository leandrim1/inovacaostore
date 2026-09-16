import { useParams } from "react-router-dom";
import { Seo } from "../components/seo/Seo";
import { ProductListingLayout } from "../components/product/ProductListingLayout";
import { useCategories } from "../hooks/useCategories";
import { useProducts } from "../hooks/useProducts";
import NotFoundPage from "./NotFoundPage";

export default function CategoryPage() {
  const { slug = "" } = useParams();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const category = categories?.find((c) => c.slug === slug);
  const { data: products = [], isLoading: isLoadingProducts } = useProducts({ category: slug });

  if (!isLoadingCategories && !category) return <NotFoundPage />;

  return (
    <>
      <Seo
        title={category?.name ?? "Categoria"}
        description={
          category
            ? `${category.description} Compre ${category.name.toLowerCase()} masculinas na Inovação Store, nacionais e importadas.`
            : undefined
        }
      />
      <ProductListingLayout
        title={category?.name ?? ""}
        subtitle={category?.description}
        baseProducts={products}
        isLoading={isLoadingCategories || isLoadingProducts}
      />
    </>
  );
}
