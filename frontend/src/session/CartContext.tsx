import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, ProductVariant } from '../services/catalog/catalogModels';
import cartMock from './CartContext.mock.json';

/** Flutter `CartCoupon`. */
export interface CartCoupon {
  code: string;
  type: 'percent' | 'freeShipping';
  label: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  gst: number;
  grandTotal: number;
  /** Amount still needed to reach free shipping (0 once reached). */
  toFreeShipping: number;
}

/**
 * Flutter `CartController`. Starts empty, like Flutter; items come from "Add to Cart".
 * Pricing: GST on the discounted item value, not on shipping; one coupon at a time.
 */
interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  isEmpty: boolean;
  coupon: CartCoupon | null;
  totals: CartTotals;
  addVariant: (variant: ProductVariant, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  /** Applies `code` and returns the coupon, or null if the code is unknown. */
  applyCoupon: (code: string) => CartCoupon | null;
  removeCoupon: () => void;
}

const cartPricing = cartMock._pricing;
const coupons = cartMock._coupons as CartCoupon[];

/**
 * Web-only: the cart is mirrored to sessionStorage so a reload or a typed URL
 * (e.g. /cart) doesn't empty it. Flutter keeps it in memory for the app's life,
 * which a browser tab only matches with storage.
 */
const STORAGE_KEY = 'cart';

interface StoredCart {
  items: CartItem[];
  couponCode: string | null;
}

function readStoredCart(): StoredCart {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredCart;
      if (Array.isArray(parsed.items)) return parsed;
    }
  } catch {
    // Storage blocked or corrupt — start empty.
  }
  return { items: [], couponCode: null };
}

const clampQty = (quantity: number) => Math.min(cartPricing.maxQuantity, quantity);

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart().items);
  const [coupon, setCoupon] = useState<CartCoupon | null>(
    () => coupons.find((c) => c.code === readStoredCart().couponCode) ?? null,
  );

  useEffect(() => {
    try {
      const stored: StoredCart = { items, couponCode: coupon?.code ?? null };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage unavailable — the cart still works for this page load.
    }
  }, [items, coupon]);

  const addVariant = useCallback((variant: ProductVariant, quantity = 1) => {
    if (quantity <= 0) return;
    const addQty = Math.max(quantity, variant.minimumOrderQuantity);
    setItems((prev) => {
      const index = prev.findIndex((i) => i.variant.id === variant.id);
      if (index < 0) return [...prev, { variant, quantity: clampQty(addQty) }];
      const next = [...prev];
      next[index] = { ...next[index], quantity: clampQty(next[index].quantity + addQty) };
      return next;
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.variant.id !== variantId);
      return prev.map((i) =>
        i.variant.id === variantId ? { ...i, quantity: clampQty(quantity) } : i,
      );
    });
  }, []);

  const remove = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variant.id !== variantId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setCoupon(null);
  }, []);

  const applyCoupon = useCallback((code: string) => {
    const match = coupons.find((c) => c.code === code.trim().toUpperCase()) ?? null;
    if (match) setCoupon(match);
    return match;
  }, []);

  const removeCoupon = useCallback(() => setCoupon(null), []);

  // `_resetCouponIfEmpty` — a coupon never outlives the last item.
  const activeCoupon = items.length === 0 ? null : coupon;

  const totals = useMemo<CartTotals>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.variant.price * i.quantity, 0);
    const discount =
      activeCoupon?.type === 'percent' ? Math.round(subtotal * cartPricing.build10Rate) : 0;
    const shipping =
      items.length === 0 ||
      activeCoupon?.type === 'freeShipping' ||
      subtotal >= cartPricing.freeShippingThreshold
        ? 0
        : cartPricing.shippingFee;
    const gst = Math.round((subtotal - discount) * cartPricing.gstRate);
    return {
      subtotal,
      discount,
      shipping,
      gst,
      grandTotal: subtotal - discount + shipping + gst,
      toFreeShipping: Math.max(0, cartPricing.freeShippingThreshold - subtotal),
    };
  }, [items, activeCoupon]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      isEmpty: items.length === 0,
      coupon: activeCoupon,
      totals,
      addVariant,
      setQuantity,
      remove,
      clear,
      applyCoupon,
      removeCoupon,
    }),
    [
      items,
      activeCoupon,
      totals,
      addVariant,
      setQuantity,
      remove,
      clear,
      applyCoupon,
      removeCoupon,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
