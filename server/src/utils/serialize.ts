import { Prisma } from "@prisma/client";

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

export function serializeProduct(product: ProductWithRelations) {
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    features: safeParseArray(product.features),
    tags: safeParseArray(product.tags),
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
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

/** Inclui o custo de aquisição — nunca exposto na API pública, só no admin. */
export function serializeAdminProduct(product: ProductWithRelations) {
  return { ...serializeProduct(product), costPrice: product.costPrice };
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
