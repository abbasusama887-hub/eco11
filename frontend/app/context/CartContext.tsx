"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "@/app/components/ToastProvider";

export interface CartItem {
  variantId: number;
  productSlug: string;
  productName: string;
  brandName: string;
  thumbnail: string | null;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ndps_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Hydrating client-only state (cart) from localStorage after mount is
      // a legitimate use of an effect — this isn't state derived from props.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — cart still works for this session
    }
  }, [items, hydrated]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    const existing = items.find((currentItem) => currentItem.variantId === item.variantId);
    setItems((prev) => {
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, existing.maxStock);
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: nextQty } : i,
        );
      }

      return [...prev, { ...item, quantity: Math.min(quantity, item.maxStock) }];
    });
    showToast({
      title: existing ? "Cart updated" : "Added to cart",
      description: existing
        ? `${item.productName} (${item.size}) was updated.`
        : `${item.productName} (${item.size}) was added to your cart.`,
    });
  };

  const removeItem = (variantId: number) => {
    const removed = items.find((i) => i.variantId === variantId);
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    if (removed) {
      showToast({ title: "Removed from cart", description: `${removed.productName} was removed from your cart.` });
    }
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.variantId === variantId
            ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
