import type { ImageSettings } from "../lib/imageSettings";

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

export interface ProductImageDetail {
  id: string;
  url: string;
  order: number;
  desktopSettings: ImageSettings | null;
  mobileSettings: ImageSettings | null;
}

/** Promoção que está valendo para um produto agora (null = preço normal). */
export interface ProductPromotion {
  id: string;
  title: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  percentOff: number;
  endsAt: string | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  /** Marca do produto. Vazio quando o lojista não preencheu. */
  brand: string;
  /** Preço que o cliente paga hoje — já com a promoção aplicada. */
  price: number;
  /** Preço de tabela, para o riscado. */
  compareAtPrice?: number;
  promotion: ProductPromotion | null;
  images: string[];
  imageDetails: ProductImageDetail[];
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
