export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image?: string;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: string;
  color: string;
  colorHex: string;
  size: string;
  stock: number;
  sku?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
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
  variants: ProductVariant[];
}
