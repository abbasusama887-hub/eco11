"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/app/types/product";
import { useToast } from "@/app/components/ToastProvider";

interface CompareContextValue {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  isCompared: (productId: number) => boolean;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);
const STORAGE_KEY = "bazar_compare";

export function CompareProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Client-only localStorage hydration is intentional here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Ignore invalid comparison storage.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Comparison remains available for the current session.
    }
  }, [items, hydrated]);

  const value = useMemo<CompareContextValue>(() => ({
    items,
    addItem: (product) => {
      if (items.some((item) => item.id === product.id)) {
        showToast({ title: "Already comparing", description: `${product.name} is already in comparison.` });
        return;
      }
      if (items.length >= 3) {
        showToast({ title: "Comparison is full", description: "Remove a product before adding another." });
        return;
      }
      setItems((current) => [...current, product]);
      showToast({ title: "Added to comparison", description: `${product.name} is ready to compare.` });
    },
    removeItem: (productId) => setItems((current) => current.filter((item) => item.id !== productId)),
    isCompared: (productId) => items.some((item) => item.id === productId),
    clear: () => setItems([]),
  }), [items, showToast]);

  if (!hydrated) return null;
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within a CompareProvider");
  return context;
}
