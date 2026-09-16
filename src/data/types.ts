export type CategorySlug =
  | "camisetas"
  | "camisas"
  | "calcas"
  | "bermudas"
  | "jaquetas"
  | "acessorios";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  image?: string;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  price: number;
  compareAtPrice?: number;
  images: string[];
  colors: ColorOption[];
  sizes: string[];
  description: string;
  features: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  tags?: Array<"novo" | "mais-vendido" | "importado" | "ultimas-unidades">;
  installmentsMax: number;
  sku: string;
  comingSoon?: boolean;
}
