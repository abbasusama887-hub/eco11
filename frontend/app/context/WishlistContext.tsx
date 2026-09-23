"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface WishlistItem {
  productId: number;
  productSlug: string;
  productName: string;
  brandName: string;
  thumbnail: string | null;
  price: number;
  currentPrice: number;
  discountPercent: number;
  isInStock: boolean;
  /** Optionally remembers the size the shopper was viewing on the PDP */
  rememberedSize?: string;
  /** Optionally remembers the color */
  rememberedColor?: string;
  /** Variant id if added from PDP — used for "Move to cart" pre-fill */
  variantId?: number;
  maxStock?: number;
}

interface WishlistContextValue {
  items: WishlistItem[];
  toggleItem: (item: WishlistItem) => void;
  removeItem: (productId: number) => void;
  isWishlisted: (productId: number) => boolean;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "ndps_wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (client-only, same pattern as CartContext)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist on every change
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — wishlist still works for this session
    }
  }, [items, hydrated]);

  const toggleItem = (item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.productId === item.productId);
      if (exists) return prev.filter((i) => i.productId !== item.productId);
      return [...prev, item];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const isWishlisted = (productId: number) =>
    items.some((i) => i.productId === productId);

  const itemCount = useMemo(() => items.length, [items]);

  const value = useMemo<WishlistContextValue>(
    () => ({ items, toggleItem, removeItem, isWishlisted, itemCount }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, itemCount],
  );

  if (!hydrated) return null;

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
