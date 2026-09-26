import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import type { Product, ProductPromotion } from "../data/types";
import { api } from "../lib/api";

export interface CartCoupon {
  code: string;
  description: string;
  percentOff: number;
}

export interface CartItem {
  key: string;
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image?: string;
  /** Preço atual (com promoção). Enquanto a cotação não chega, vale o valor gravado ao adicionar. */
  price: number;
  /** Preço de tabela — só vem preenchido quando há promoção valendo. */
  originalPrice?: number;
  promotion?: ProductPromotion | null;
  color: string;
  size: string;
  quantity: number;
  /** Estoque da variação no momento em que foi adicionada ao carrinho (usado para limitar o stepper de quantidade). */
  stock: number;
}

interface PricedLine {
  variantId: string;
  available: boolean;
  price?: number;
  originalPrice?: number;
  percentOff?: number;
  stock?: number;
  promotion?: { id: string; title: string; discountType: "percent" | "fixed"; discountValue: number; endsAt: string | null } | null;
}

interface PricingQuote {
  items: PricedLine[];
  grossSubtotal: number;
  promotionDiscount: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  coupon: CartCoupon | null;
}

const STORAGE_KEY = "inovacaostore.cart.v2";

function loadState(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], coupon: null };
    const parsed = JSON.parse(raw) as CartState;
    const items = (parsed.items ?? []).map((i) => ({ ...i, stock: i.stock ?? 99 }));
    return { items, coupon: parsed.coupon ?? null };
  } catch {
    return { items: [], coupon: null };
  }
}

function saveState(state: CartState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage indisponível (modo privado, etc.) — segue sem persistir
  }
}

interface CartContextValue {
  items: CartItem[];
  coupon: CartCoupon | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (
    product: Product,
    options: {
      variantId: string;
      color: string;
      size: string;
      quantity?: number;
      /**
       * Abre a gaveta do carrinho depois de adicionar (padrão). Quem mostra a
       * microinteração de "voo" até o ícone passa `false`: aí o retorno é o
       * ícone quicando e o aviso de sucesso, sem interromper a navegação.
       */
      abrirCarrinho?: boolean;
    },
  ) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ ok: boolean; error?: string }>;
  removeCoupon: () => void;
  /** Soma dos itens pelo preço de tabela (antes das promoções). */
  grossSubtotal: number;
  /** Quanto as promoções abateram. */
  promotionDiscount: number;
  /** Soma dos itens já com as promoções aplicadas. */
  subtotal: number;
  /** Desconto do cupom, sobre o subtotal já promocional. */
  discount: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(() => loadState());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addItem: CartContextValue["addItem"] = useCallback(
    (product, { variantId, color, size, quantity = 1, abrirCarrinho = true }) => {
      const stock = product.variants.find((v) => v.id === variantId)?.stock ?? 0;
      setState((prev) => {
        const existing = prev.items.find((i) => i.key === variantId);
        if (existing) {
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.key === variantId
                ? { ...i, stock, quantity: Math.min(i.quantity + quantity, Math.max(1, stock)) }
                : i,
            ),
          };
        }
        const newItem: CartItem = {
          key: variantId,
          variantId,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          price: product.price,
          originalPrice: product.promotion ? product.compareAtPrice : undefined,
          promotion: product.promotion,
          color,
          size,
          quantity: Math.min(quantity, Math.max(1, stock)),
          stock,
        };
        return { ...prev, items: [...prev.items, newItem] };
      });
      if (abrirCarrinho) setIsOpen(true);
    },
    [],
  );

  const removeItem = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.key !== key),
    }));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      items: prev.items
        .map((i) => (i.key === key ? { ...i, quantity: Math.min(quantity, Math.max(1, i.stock)) } : i))
        .filter((i) => i.quantity > 0),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setState({ items: [], coupon: null });
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    try {
      const found = await api.post<CartCoupon>("/api/coupons/validate", { code });
      setState((prev) => ({ ...prev, coupon: found }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Cupom inválido." };
    }
  }, []);

  const removeCoupon = useCallback(() => {
    setState((prev) => ({ ...prev, coupon: null }));
  }, []);

  // O preço fica guardado no navegador quando o item entra no carrinho. Se
  // uma promoção começa, muda ou expira depois disso, aquele número envelhece.
  // Aqui perguntamos ao servidor — o MESMO cálculo usado para criar o pedido —
  // quanto os itens custam agora, para a tela nunca prometer um preço que o
  // servidor não vai cobrar.
  const assinatura = state.items.map((i) => `${i.variantId}:${i.quantity}`).join("|");
  const { data: cotacao } = useQuery({
    queryKey: ["cart-pricing", assinatura],
    enabled: state.items.length > 0,
    staleTime: 30 * 1000,
    // Uma promoção pode expirar com o carrinho aberto na tela.
    refetchInterval: 60 * 1000,
    queryFn: () =>
      api.post<PricingQuote>("/api/pricing/quote", {
        items: state.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      }),
  });

  const precosFrescos = useMemo(() => {
    const mapa = new Map<string, PricedLine>();
    for (const linha of cotacao?.items ?? []) mapa.set(linha.variantId, linha);
    return mapa;
  }, [cotacao]);

  const items = useMemo(
    () =>
      state.items.map((item) => {
        const fresco = precosFrescos.get(item.variantId);
        if (!fresco?.available || fresco.price === undefined) return item;
        return {
          ...item,
          price: fresco.price,
          originalPrice: fresco.promotion ? fresco.originalPrice : undefined,
          promotion: fresco.promotion
            ? { ...fresco.promotion, percentOff: fresco.percentOff ?? 0 }
            : null,
          stock: fresco.stock ?? item.stock,
        };
      }),
    [state.items, precosFrescos],
  );

  const subtotal = useMemo(
    () => Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100,
    [items],
  );

  const grossSubtotal = useMemo(
    () =>
      Math.round(
        items.reduce((sum, i) => sum + (i.originalPrice ?? i.price) * i.quantity, 0) * 100,
      ) / 100,
    [items],
  );

  const promotionDiscount = Math.round((grossSubtotal - subtotal) * 100) / 100;

  const discount = useMemo(() => {
    if (!state.coupon) return 0;
    return Math.round(subtotal * (state.coupon.percentOff / 100) * 100) / 100;
  }, [subtotal, state.coupon]);

  const total = Math.max(0, subtotal - discount);

  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items],
  );

  const value: CartContextValue = {
    items,
    coupon: state.coupon,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    grossSubtotal,
    promotionDiscount,
    subtotal,
    discount,
    total,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
