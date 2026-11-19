"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  image: string;
  price: number;
  unitsPerPack: number;
  quantity: number;
  stock: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty: number) => void;
  setQuantity: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  qtyInCart: (variantId: string) => number;
  totalUnits: number;
  subtotal: number;
  minUnits: number;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "og-cart-v1";

export function CartProvider({ minUnits, children }: { minUnits: number; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* storage vacío o bloqueado */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignorar */
    }
  }, [items, hydrated]);

  const add = useCallback<CartContextValue["add"]>((item, qty) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.variantId === item.variantId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = {
          ...next[i],
          price: item.price,
          stock: item.stock,
          quantity: Math.min(item.stock, next[i].quantity + qty),
        };
        return next;
      }
      const q = Math.min(item.stock, qty);
      return q > 0 ? [...prev, { ...item, quantity: q }] : prev;
    });
  }, []);

  const setQuantity = useCallback((variantId: string, qty: number) => {
    setItems((prev) =>
      prev.map((p) => (p.variantId === variantId ? { ...p, quantity: Math.max(1, Math.min(p.stock, qty)) } : p))
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((p) => p.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      add,
      setQuantity,
      remove,
      clear,
      qtyInCart: (id) => items.find((p) => p.variantId === id)?.quantity ?? 0,
      totalUnits: items.reduce((s, p) => s + p.quantity * p.unitsPerPack, 0),
      subtotal: items.reduce((s, p) => s + p.quantity * p.price, 0),
      minUnits,
      open,
      setOpen,
    }),
    [items, add, setQuantity, remove, clear, minUnits, open]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
