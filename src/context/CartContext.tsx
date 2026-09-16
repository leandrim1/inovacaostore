import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "../data/types";
import { findCoupon, type Coupon } from "../lib/coupons";

export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image?: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
}

const STORAGE_KEY = "inovacaostore.cart.v1";

function loadState(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], coupon: null };
    const parsed = JSON.parse(raw) as CartState;
    return { items: parsed.items ?? [], coupon: parsed.coupon ?? null };
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
  coupon: Coupon | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (
    product: Product,
    options: { color: string; size: string; quantity?: number },
  ) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  subtotal: number;
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
    (product, { color, size, quantity = 1 }) => {
      const key = `${product.id}-${color}-${size}`;
      setState((prev) => {
        const existing = prev.items.find((i) => i.key === key);
        if (existing) {
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.key === key ? { ...i, quantity: i.quantity + quantity } : i,
            ),
          };
        }
        const newItem: CartItem = {
          key,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          price: product.price,
          color,
          size,
          quantity,
        };
        return { ...prev, items: [...prev.items, newItem] };
      });
      setIsOpen(true);
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
        .map((i) => (i.key === key ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setState({ items: [], coupon: null });
  }, []);

  const applyCoupon = useCallback((code: string) => {
    const found = findCoupon(code);
    if (!found) return false;
    setState((prev) => ({ ...prev, coupon: found }));
    return true;
  }, []);

  const removeCoupon = useCallback(() => {
    setState((prev) => ({ ...prev, coupon: null }));
  }, []);

  const subtotal = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [state.items],
  );

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
    items: state.items,
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
