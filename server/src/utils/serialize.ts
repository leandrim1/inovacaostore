import { Prisma } from "@prisma/client";
import { priceProduct, serializePromotionRef, type ActivePromotion } from "../promotions.js";

const productWithRelations = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: { images: { orderBy: { order: "asc" } }, variants: true, category: true },
});

export type ProductWithRelations = Prisma.ProductGetPayload<typeof productWithRelations>;

function safeParseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Produto para a vitrine. `price` já é o preço COM promoção e
 * `compareAtPrice` vira o preço de tabela — é assim que os cards e a página
 * de produto, que já liam esses dois campos, passam a mostrar o riscado e o
 * selo "-20%" sem nenhuma mudança neles.
 *
 * Quando a promoção manda no preço, ela substitui o "de/por" manual do
 * produto: o selo precisa refletir o desconto que está realmente valendo, e
 * não a soma de dois descontos diferentes.
 */
export function serializeProduct(product: ProductWithRelations, promotions: ActivePromotion[] = []) {
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const pricing = priceProduct(product, promotions);
  const emPromocao = pricing.promotion !== null;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    features: safeParseArray(product.features),
    tags: safeParseArray(product.tags),
    brand: product.brand,
    price: pricing.price,
    compareAtPrice: emPromocao ? pricing.originalPrice : (product.compareAtPrice ?? undefined),
    promotion: pricing.promotion
      ? { ...serializePromotionRef(pricing.promotion), percentOff: pricing.percentOff }
      : null,
    weightKg: product.weightKg,
    volumeM3: product.volumeM3,
    sku: product.sku,
    featured: product.featured,
    active: product.active,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: totalStock,
    category: {
      slug: product.category.slug,
      name: product.category.name,
    },
    categoryId: product.categoryId,
    images: product.images.map((img) => img.url),
    imageDetails: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      order: img.order,
      desktopSettings: img.desktopSettings,
      mobileSettings: img.mobileSettings,
    })),
    colors: dedupeColors(product.variants),
    sizes: dedupeSizes(product.variants),
    variants: product.variants.map((v) => ({
      id: v.id,
      color: v.color,
      colorHex: v.colorHex,
      size: v.size,
      stock: v.stock,
      sku: v.sku ?? undefined,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/**
 * Produto para o painel. Diferença crucial para a vitrine: `price` continua
 * sendo o PREÇO DE TABELA. O formulário de produto lê esse campo, e devolver
 * o preço promocional aqui faria o admin salvar o desconto como se fosse o
 * novo preço do produto — exatamente o que o pedido proíbe. O valor com
 * desconto vem à parte, só para exibição.
 */
export function serializeAdminProduct(product: ProductWithRelations, promotions: ActivePromotion[] = []) {
  const pricing = priceProduct(product, promotions);
  return {
    ...serializeProduct(product),
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    costPrice: product.costPrice,
    promotion: pricing.promotion
      ? { ...serializePromotionRef(pricing.promotion), percentOff: pricing.percentOff }
      : null,
    promotionalPrice: pricing.promotion ? pricing.price : null,
  };
}

function dedupeColors(variants: ProductWithRelations["variants"]) {
  const map = new Map<string, string>();
  for (const v of variants) map.set(v.color, v.colorHex);
  return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
}

function dedupeSizes(variants: ProductWithRelations["variants"]) {
  const set = new Set<string>();
  for (const v of variants) set.add(v.size);
  return Array.from(set);
}
