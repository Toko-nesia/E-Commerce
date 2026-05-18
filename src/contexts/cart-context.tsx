"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { Product, ProductVariant } from "@/types/database";

// =============================================================================
// Cart Context - global shopping cart state
// Future: sync with Supabase cart table or use server session
// =============================================================================

export interface CartItem {
  product: Product;
  qty: number;
  variant?: ProductVariant | null;
  customAmountRaw?: number | null;
  buyerNote?: string | null;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalWeight: number;
  canCheckout: boolean;
  addToCart: (product: Product, qty?: number, options?: CartAddOptions) => CartActionResult;
  removeFromCart: (itemKey: number | string) => void;
  updateQty: (itemKey: number | string, qty: number) => CartActionResult;
  updateItemNote: (itemKey: number | string, note: string) => void;
  clearCart: () => void;
  resolveCartStock: () => Promise<string[]>;
}

export interface CartActionResult {
  acceptedQty: number;
  finalQty: number;
  limitedByStock: boolean;
  message?: string;
}

export interface CartAddOptions {
  variant?: ProductVariant | null;
  customAmountRaw?: number | null;
  buyerNote?: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "tokonesia_cart";

export function getCartItemKey(item: CartItem): string {
  return `${item.product.id}:${item.variant?.id ?? ""}:${item.customAmountRaw ?? ""}`;
}

export function getCartItemUnitPrice(item: CartItem): number {
  return Number(item.customAmountRaw ?? item.variant?.price_raw ?? item.product.price_raw ?? 0);
}

export function getCartItemPrice(item: CartItem): string {
  return item.customAmountRaw
    ? `Rp${item.customAmountRaw.toLocaleString("id-ID")}`
    : item.variant?.price ?? item.product.price;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    itemsRef.current = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((product: Product, qty = 1, options: CartAddOptions = {}): CartActionResult => {
    const stock = Math.max(0, Number(options.variant?.stock ?? product.stock ?? 0));
    const nextItem: CartItem = {
      product,
      qty: 0,
      variant: options.variant ?? null,
      customAmountRaw: options.customAmountRaw ?? null,
      buyerNote: options.buyerNote ?? null,
    };
    const itemKey = getCartItemKey(nextItem);
    const existing = itemsRef.current.find((item) => getCartItemKey(item) === itemKey);
    const currentQty = existing?.qty ?? 0;
    const requestedQty = Math.max(0, qty);
    const finalQty = Math.min(stock, currentQty + requestedQty);
    const acceptedQty = Math.max(0, finalQty - currentQty);
    const limitedByStock = acceptedQty < requestedQty;
    const result: CartActionResult = {
      acceptedQty,
      finalQty,
      limitedByStock,
      message: limitedByStock
        ? stock <= 0
          ? `${product.name} is out of stock.`
          : `Only ${stock} ${stock === 1 ? "unit is" : "units are"} available.`
        : undefined,
    };

    setItems((prev) => {
      if (finalQty <= 0) {
        return prev;
      }
      if (existing) {
        return prev.map((item) =>
          getCartItemKey(item) === itemKey
            ? {
                product: { ...item.product, ...product, stock },
                variant: options.variant ?? item.variant ?? null,
                customAmountRaw: options.customAmountRaw ?? item.customAmountRaw ?? null,
                buyerNote: item.buyerNote ?? options.buyerNote ?? null,
                qty: finalQty,
              }
            : item,
        );
      }
      return [...prev, {
        product: { ...product, stock },
        variant: options.variant ?? null,
        customAmountRaw: options.customAmountRaw ?? null,
        buyerNote: options.buyerNote ?? null,
        qty: finalQty,
      }];
    });
    return result;
  }, []);

  const removeFromCart = useCallback((itemKey: number | string) => {
    setItems((prev) => prev.filter((item) => {
      if (typeof itemKey === "number") return item.product.id !== itemKey;
      return getCartItemKey(item) !== itemKey;
    }));
  }, []);

  const updateQty = useCallback((itemKey: number | string, qty: number): CartActionResult => {
    const existing = itemsRef.current.find((item) =>
      typeof itemKey === "number" ? item.product.id === itemKey : getCartItemKey(item) === itemKey
    );
    const stock = Math.max(0, Number(existing?.variant?.stock ?? existing?.product.stock ?? 0));
    const finalQty = qty <= 0 ? 0 : Math.min(qty, stock);
    const result: CartActionResult = {
      acceptedQty: Math.max(0, finalQty - (existing?.qty ?? 0)),
      finalQty,
      limitedByStock: finalQty < qty,
      message: finalQty < qty ? `Only ${stock} ${stock === 1 ? "unit is" : "units are"} available.` : undefined,
    };
    if (qty <= 0) {
      setItems((prev) => prev.filter((item) =>
        typeof itemKey === "number" ? item.product.id !== itemKey : getCartItemKey(item) !== itemKey
      ));
      return result;
    }
    setItems((prev) =>
      prev.map((item) => {
        const matches = typeof itemKey === "number" ? item.product.id === itemKey : getCartItemKey(item) === itemKey;
        if (!matches) return item;
        return { ...item, qty: finalQty };
      }).filter((item) => item.qty > 0),
    );
    return result;
  }, []);

  const updateItemNote = useCallback((itemKey: number | string, note: string) => {
    const nextNote = note.slice(0, 2000);
    setItems((prev) =>
      prev.map((item) => {
        const matches = typeof itemKey === "number" ? item.product.id === itemKey : getCartItemKey(item) === itemKey;
        return matches ? { ...item, buyerNote: nextNote } : item;
      }),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const resolveCartStock = useCallback(async (): Promise<string[]> => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) return [];
    const res = await fetch("/api/catalog/cart/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        items: currentItems.map(({ product, qty, variant, customAmountRaw, buyerNote }) => ({
          productId: product.id,
          quantity: qty,
          variantId: variant?.id ?? null,
          customAmountRaw: customAmountRaw ?? null,
          buyerNote: buyerNote ?? "",
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to refresh cart stock.");
    }
    setItems((data.items ?? []).map((item: { product: Product; quantity: number; variant?: ProductVariant | null; customAmountRaw?: number | null; buyerNote?: string | null }) => ({
      product: item.product,
      qty: item.quantity,
      variant: item.variant ?? null,
      customAmountRaw: item.customAmountRaw ?? null,
      buyerNote: item.buyerNote ?? "",
    })));
    return Array.isArray(data.issues) ? data.issues : [];
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + getCartItemUnitPrice(item) * item.qty,
    0,
  );
  const totalWeight = items.reduce(
    (sum, item) => sum + (item.product.weight_kg ?? 0) * item.qty,
    0,
  );
  const canCheckout = totalWeight >= 21;

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalPrice, totalWeight, canCheckout, addToCart, removeFromCart, updateQty, updateItemNote, clearCart, resolveCartStock }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
