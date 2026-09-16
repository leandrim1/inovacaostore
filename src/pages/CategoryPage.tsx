import { useParams } from "react-router-dom";
import { Seo } from "../components/seo/Seo";
import { ProductListingLayout } from "../components/product/ProductListingLayout";
import { getCategory } from "../data/categories";
import { getProductsByCategory } from "../data/products";
import NotFoundPage from "./NotFoundPage";

export default function CategoryPage() {
  const { slug = "" } = useParams();
  const category = getCategory(slug);

  if (!category) return <NotFoundPage />;

  const products = getProductsByCategory(category.slug);

  return (
    <>
      <Seo
        title={category.name}
        description={`${category.description} Compre ${category.name.toLowerCase()} masculinas na Inovação Store, nacionais e importadas.`}
      />
      <ProductListingLayout
        title={category.name}
        subtitle={category.description}
        baseProducts={products}
      />
    </>
  );
}
