import { prisma } from "./db.js";

/**
 * Motor de descontos das promoções.
 *
 * Esta é a ÚNICA autoridade sobre "quanto custa este produto agora". Vitrine,
 * página de produto, carrinho e criação de pedido importam daqui — nenhum
 * deles recalcula por conta própria. O preço de tabela (`Product.price`)
 * nunca é sobrescrito: o desconto é sempre derivado na hora da leitura, então
 * desativar ou expirar uma promoção devolve o preço original sozinho.
 */

export type DiscountType = "percent" | "fixed";
export type DiscountScope = "all" | "category" | "products";

export const DISCOUNT_TYPES: DiscountType[] = ["percent", "fixed"];
export const DISCOUNT_SCOPES: DiscountScope[] = ["all", "category", "products"];

export interface ActivePromotion {
  id: string;
  title: string;
  discountType: DiscountType;
  discountValue: number;
  discountScope: DiscountScope;
  categoryId: string | null;
  productIds: string[];
  startsAt: Date | null;
  endsAt: Date | null;
  order: number;
  createdAt: Date;
}

export interface ProductPricing {
  /** Preço que o cliente paga agora. */
  price: number;
  /** Preço de tabela. Igual a `price` quando não há promoção. */
  originalPrice: number;
  /** Quanto foi abatido por unidade (0 quando não há promoção). */
  discountAmount: number;
  /** Percentual arredondado, para o selo "-20%". */
  percentOff: number;
  promotion: ActivePromotion | null;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Uma promoção só desconta se estiver ativa, dentro da janela e com valor. */
export function isDiscountingNow(
  promo: Pick<ActivePromotion, "discountValue" | "startsAt" | "endsAt">,
  now: Date = new Date(),
) {
  if (promo.discountValue <= 0) return false;
  if (promo.startsAt && promo.startsAt.getTime() > now.getTime()) return false;
  if (promo.endsAt && promo.endsAt.getTime() <= now.getTime()) return false;
  return true;
}

/**
 * Carrega do banco as promoções que estão descontando NESTE instante.
 * Uma consulta só, reaproveitada por toda a listagem de produtos.
 */
export async function loadActivePromotions(now: Date = new Date()): Promise<ActivePromotion[]> {
  const rows = await prisma.promotion.findMany({
    where: {
      active: true,
      discountValue: { gt: 0 },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    include: { products: { select: { productId: true } } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return rows.map(toActivePromotion);
}

type PromotionRow = {
  id: string;
  title: string;
  discountType: string;
  discountValue: number;
  discountScope: string;
  categoryId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  order: number;
  createdAt: Date;
  products?: { productId: string }[];
};

export function toActivePromotion(row: PromotionRow): ActivePromotion {
  return {
    id: row.id,
    title: row.title,
    discountType: (DISCOUNT_TYPES as string[]).includes(row.discountType)
      ? (row.discountType as DiscountType)
      : "percent",
    discountValue: row.discountValue,
    discountScope: (DISCOUNT_SCOPES as string[]).includes(row.discountScope)
      ? (row.discountScope as DiscountScope)
      : "all",
    categoryId: row.categoryId,
    productIds: (row.products ?? []).map((p) => p.productId),
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    order: row.order,
    createdAt: row.createdAt,
  };
}

/** Quanto mais específico o alcance, maior a prioridade. */
const SCOPE_PRIORITY: Record<DiscountScope, number> = { products: 3, category: 2, all: 1 };

function appliesTo(promo: ActivePromotion, product: { id: string; categoryId: string }) {
  if (promo.discountScope === "all") return true;
  if (promo.discountScope === "category") return promo.categoryId === product.categoryId;
  return promo.productIds.includes(product.id);
}

/**
 * Escolhe UMA promoção para o produto. Nunca soma duas.
 *
 * Prioridade: produto específico > categoria > loja inteira. Dentro do mesmo
 * nível — que o cadastro já tenta impedir — o desempate é determinístico
 * (maior desconto, depois menor `order`, depois mais antiga, depois id), para
 * que o mesmo produto nunca mostre um preço no carrinho e outro no pedido.
 */
export function pickPromotion(
  promotions: ActivePromotion[],
  product: { id: string; categoryId: string; price: number },
): ActivePromotion | null {
  const candidates = promotions.filter((p) => appliesTo(p, product));
  if (candidates.length === 0) return null;

  return candidates.reduce((melhor, atual) => {
    const pa = SCOPE_PRIORITY[atual.discountScope];
    const pm = SCOPE_PRIORITY[melhor.discountScope];
    if (pa !== pm) return pa > pm ? atual : melhor;

    const da = discountAmountFor(product.price, atual);
    const dm = discountAmountFor(product.price, melhor);
    if (da !== dm) return da > dm ? atual : melhor;

    if (atual.order !== melhor.order) return atual.order < melhor.order ? atual : melhor;

    const ta = atual.createdAt.getTime();
    const tm = melhor.createdAt.getTime();
    if (ta !== tm) return ta < tm ? atual : melhor;

    return atual.id < melhor.id ? atual : melhor;
  });
}

/** Valor abatido por unidade, sem nunca deixar o preço negativo. */
export function discountAmountFor(price: number, promo: ActivePromotion): number {
  if (promo.discountValue <= 0) return 0;
  const bruto =
    promo.discountType === "percent" ? (price * promo.discountValue) / 100 : promo.discountValue;
  return round2(Math.min(Math.max(bruto, 0), price));
}

/** Preço final de um produto, já considerando prioridade e conflito. */
export function priceProduct(
  product: { id: string; categoryId: string; price: number },
  promotions: ActivePromotion[],
): ProductPricing {
  const promo = pickPromotion(promotions, product);
  if (!promo) {
    return {
      price: round2(product.price),
      originalPrice: round2(product.price),
      discountAmount: 0,
      percentOff: 0,
      promotion: null,
    };
  }

  const discountAmount = discountAmountFor(product.price, promo);
  const price = round2(product.price - discountAmount);

  if (discountAmount <= 0) {
    return {
      price: round2(product.price),
      originalPrice: round2(product.price),
      discountAmount: 0,
      percentOff: 0,
      promotion: null,
    };
  }

  return {
    price,
    originalPrice: round2(product.price),
    discountAmount,
    percentOff: product.price > 0 ? Math.round((discountAmount / product.price) * 100) : 0,
    promotion: promo,
  };
}

/** Recorte da promoção que vai para o cliente — nada além do necessário. */
export function serializePromotionRef(promo: ActivePromotion) {
  return {
    id: promo.id,
    title: promo.title,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    endsAt: promo.endsAt,
  };
}

// ---------------------------------------------------------------------------
// Conflito entre promoções
// ---------------------------------------------------------------------------

interface ConflictCandidate {
  id: string;
  title: string;
  active: boolean;
  discountValue: number;
  discountScope: string;
  categoryId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  products?: { productId: string }[];
}

function janelasSeCruzam(a: ConflictCandidate, b: ConflictCandidate) {
  const inicioA = a.startsAt?.getTime() ?? -Infinity;
  const fimA = a.endsAt?.getTime() ?? Infinity;
  const inicioB = b.startsAt?.getTime() ?? -Infinity;
  const fimB = b.endsAt?.getTime() ?? Infinity;
  return inicioA < fimB && inicioB < fimA;
}

function alcancesColidem(a: ConflictCandidate, b: ConflictCandidate) {
  if (a.discountScope !== b.discountScope) return false;
  if (a.discountScope === "all") return true;
  if (a.discountScope === "category") return a.categoryId != null && a.categoryId === b.categoryId;
  const idsB = new Set((b.products ?? []).map((p) => p.productId));
  return (a.products ?? []).some((p) => idsB.has(p.productId));
}

/**
 * Procura uma promoção já cadastrada que disputaria os mesmos produtos, no
 * mesmo período e no mesmo nível de alcance. A regra do pedido é "nunca somar
 * dois descontos": em vez de inventar um critério na hora da venda, o cadastro
 * é barrado antes.
 */
export async function findConflictingPromotion(candidate: {
  id?: string;
  active: boolean;
  discountValue: number;
  discountScope: string;
  categoryId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  productIds: string[];
}): Promise<{ id: string; title: string } | null> {
  if (!candidate.active || candidate.discountValue <= 0) return null;

  const existentes = await prisma.promotion.findMany({
    where: {
      active: true,
      discountValue: { gt: 0 },
      discountScope: candidate.discountScope,
      ...(candidate.id ? { id: { not: candidate.id } } : {}),
      ...(candidate.discountScope === "category" ? { categoryId: candidate.categoryId } : {}),
    },
    include: { products: { select: { productId: true } } },
  });

  const novo: ConflictCandidate = {
    id: candidate.id ?? "",
    title: "",
    active: candidate.active,
    discountValue: candidate.discountValue,
    discountScope: candidate.discountScope,
    categoryId: candidate.categoryId,
    startsAt: candidate.startsAt,
    endsAt: candidate.endsAt,
    products: candidate.productIds.map((productId) => ({ productId })),
  };

  const conflito = existentes.find((e) => alcancesColidem(novo, e) && janelasSeCruzam(novo, e));
  return conflito ? { id: conflito.id, title: conflito.title } : null;
}
