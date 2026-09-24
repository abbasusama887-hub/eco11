"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getCategories, getProducts } from "@/app/lib/api";
import type { Category, Product } from "@/app/types/product";

const RECENT_SEARCHES_KEY = "bazar_recent_searches";

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function SearchAutocomplete({ className = "" }: { className?: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      // Client-only localStorage hydration is intentional here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setRecent(JSON.parse(stored));
    } catch {
      // Ignore unavailable storage.
    }
  }, []);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  useEffect(() => {
    if (!open || !query.trim()) {
      // Reset suggestions when the popover is cleared.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    Promise.all([getProducts({ search: query.trim(), limit: 5 }), getCategories()])
      .then(([productResponse, categoryResponse]) => {
        if (!controller.signal.aborted) {
          setProducts(productResponse.results);
          setCategories(categoryResponse);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setProducts([]);
          setCategories([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, query]);

  function saveRecent(value: string) {
    const next = [value, ...recent.filter((item) => item !== value)].slice(0, 5);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Ignore unavailable storage.
    }
  }

  function search(value = query) {
    const trimmed = value.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    setOpen(false);
    router.push(`/shop?search=${encodeURIComponent(trimmed)}`);
  }

  function removeRecent(value: string) {
    const next = recent.filter((item) => item !== value);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Ignore unavailable storage.
    }
  }

  function clearRecent() {
    setRecent([]);
    try {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  }

  const matchingCategories = query.trim()
    ? categories.filter((category) => category.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : [];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label="Search products"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="group rounded-xl p-2 text-slate-700 transition-all duration-200 hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-[0_0_18px_rgba(34,211,238,0.18)]"
      >
        <SearchIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-[min(90vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 text-slate-950 shadow-[0_16px_40px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              search();
            }}
            className="flex items-center gap-2 border-b border-slate-200 p-3"
          >
            <SearchIcon />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search shoes..."
              aria-label="Search shoes"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-xs text-slate-400 hover:text-slate-700">Clear</button>}
          </form>

          <div className="max-h-[min(70vh,420px)] overflow-y-auto p-2">
            {loading && <p className="px-3 py-5 text-center text-sm text-slate-500">Searching...</p>}
            {!loading && query.trim() && products.length === 0 && matchingCategories.length === 0 && (
              <p className="px-3 py-5 text-center text-sm text-slate-500">No results found</p>
            )}
            {!loading && products.length > 0 && (
              <div>
                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Products</p>
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => { saveRecent(query.trim()); setOpen(false); router.push(`/products/${product.slug}`); }}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-cyan-50"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {product.thumbnail && <Image src={product.thumbnail} alt="" fill sizes="44px" className="object-cover" />}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{product.name}</span>
                      <span className="block text-xs text-slate-500">Rs {Number(product.current_price).toLocaleString()}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {!loading && matchingCategories.length > 0 && (
              <div className="mt-1 border-t border-slate-100 pt-1">
                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Categories</p>
                {matchingCategories.map((category) => (
                  <button key={category.id} type="button" onClick={() => { setOpen(false); router.push(`/shop?category=${category.slug}`); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-cyan-50">
                    <span>{category.name}</span><span className="text-xs text-slate-400">{category.product_count} products</span>
                  </button>
                ))}
              </div>
            )}
            {!query.trim() && recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Recent searches</p>
                  <button type="button" onClick={clearRecent} className="text-xs text-slate-500 hover:text-cyan-700">Clear all</button>
                </div>
                {recent.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-50">
                    <button type="button" onClick={() => { setQuery(item); search(item); }} className="min-w-0 flex-1 truncate text-left text-sm text-slate-700">{item}</button>
                    <button type="button" onClick={() => removeRecent(item)} aria-label={`Remove ${item} from recent searches`} className="text-slate-400 hover:text-slate-700">×</button>
                  </div>
                ))}
              </div>
            )}
            {!query.trim() && recent.length === 0 && <p className="px-3 py-5 text-center text-sm text-slate-500">Search by product or category</p>}
          </div>
        </div>
      )}
    </div>
  );
}
