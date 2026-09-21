import type { Product, ProductImageDetail, ProductPromotion, ProductVariant } from "../data/types";

export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  features: string[];
  tags: string[];
  brand: string;
  price: number;
  compareAtPrice?: number;
  promotion?: ProductPromotion | null;
  /** Só vem na API do painel: o preço já com a promoção. Na resposta pública
   *  esse valor já está em `price`, então lá o campo não existe. */
  promotionalPrice?: number | null;
  costPrice: number;
  weightKg: number;
  volumeM3: number;
  sku: string;
  featured: boolean;
  active: boolean;
  rating: number;
  reviewCount: number;
  stock: number;
  category: { slug: string; name: string };
  categoryId: string;
  images: string[];
  imageDetails: ProductImageDetail[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  variants: ProductVariant[];
}

function installmentsForPrice(price: number) {
  if (price >= 200) return 4;
  if (price >= 100) return 3;
  return 2;
}

export function adaptProduct(dto: ProductDTO): Product {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    category: dto.category.slug,
    brand: dto.brand ?? "",
    price: dto.price,
    compareAtPrice: dto.compareAtPrice,
    promotion: dto.promotion ?? null,
    images: dto.images,
    imageDetails: dto.imageDetails,
    colors: dto.colors,
    sizes: dto.sizes,
    description: dto.description,
    features: dto.features,
    stock: dto.stock,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    tags: dto.tags as Product["tags"],
    installmentsMax: installmentsForPrice(dto.price),
    sku: dto.sku,
    comingSoon: !dto.active,
    variants: dto.variants,
  };
}
