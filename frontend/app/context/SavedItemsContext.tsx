"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "@/app/context/CartContext";
import { useToast } from "@/app/components/ToastProvider";

interface SavedItemsContextValue {
  items: CartItem[];
  saveItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
}

const SavedItemsContext = createContext<SavedItemsContextValue | null>(null);
const STORAGE_KEY = "bazar_saved_items";

export function SavedItemsProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Client-only localStorage hydration is intentional here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Ignore invalid saved-item storage.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Session state still works. */ }
  }, [items, hydrated]);

  const value = useMemo<SavedItemsContextValue>(() => ({
    items,
    saveItem: (item) => {
      if (items.some((saved) => saved.variantId === item.variantId)) return;
      setItems((current) => [...current, item]);
      showToast({ title: "Saved for later", description: `${item.productName} is saved in your cart.` });
    },
    removeItem: (variantId) => setItems((current) => current.filter((item) => item.variantId !== variantId)),
  }), [items, showToast]);

  return <SavedItemsContext.Provider value={value}>{children}</SavedItemsContext.Provider>;
}

export function useSavedItems() {
  const context = useContext(SavedItemsContext);
  if (!context) throw new Error("useSavedItems must be used within a SavedItemsProvider");
  return context;
}
