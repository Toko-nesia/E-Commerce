"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { Product } from "@/types/database";

// =============================================================================
// Cart Context - global shopping cart state
// Future: sync with Supabase cart table or use server session
// =============================================================================

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalWeight: number;
  canCheckout: boolean;
  addToCart: (product: Product, qty?: number) => CartActionResult;
  removeFromCart: (productId: number) => void;
  updateQty: (productId: number, qty: number) => CartActionResult;
  clearCart: () => void;
  resolveCartStock: () => Promise<string[]>;
}

export interface CartActionResult {
  acceptedQty: number;
  finalQty: number;
  limitedByStock: boolean;
  message?: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "tokonesia_cart";

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

  const addToCart = useCallback((product: Product, qty = 1): CartActionResult => {
    const stock = Math.max(0, Number(product.stock ?? 0));
    const existing = itemsRef.current.find((item) => item.product.id === product.id);
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
          item.product.id === product.id
            ? { product: { ...item.product, ...product, stock }, qty: finalQty }
            : item,
        );
      }
      return [...prev, { product: { ...product, stock }, qty: finalQty }];
    });
    return result;
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId: number, qty: number): CartActionResult => {
    const existing = itemsRef.current.find((item) => item.product.id === productId);
    const stock = Math.max(0, Number(existing?.product.stock ?? 0));
    const finalQty = qty <= 0 ? 0 : Math.min(qty, stock);
    const result: CartActionResult = {
      acceptedQty: Math.max(0, finalQty - (existing?.qty ?? 0)),
      finalQty,
      limitedByStock: finalQty < qty,
      message: finalQty < qty ? `Only ${stock} ${stock === 1 ? "unit is" : "units are"} available.` : undefined,
    };
    if (qty <= 0) {
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
      return result;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        return { ...item, qty: finalQty };
      }).filter((item) => item.qty > 0),
    );
    return result;
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
        items: currentItems.map(({ product, qty }) => ({
          productId: product.id,
          quantity: qty,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to refresh cart stock.");
    }
    setItems((data.items ?? []).map((item: { product: Product; quantity: number }) => ({
      product: item.product,
      qty: item.quantity,
    })));
    return Array.isArray(data.issues) ? data.issues : [];
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price_raw * item.qty,
    0,
  );
  const totalWeight = items.reduce(
    (sum, item) => sum + (item.product.weight_kg ?? 0) * item.qty,
    0,
  );
  const canCheckout = totalWeight >= 21;

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalPrice, totalWeight, canCheckout, addToCart, removeFromCart, updateQty, clearCart, resolveCartStock }}
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
