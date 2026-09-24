"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCompare } from "@/app/context/CompareContext";
import { getProductBySlug } from "@/app/lib/api";
import type { ProductDetail } from "@/app/types/product";

export default function ComparePage() {
  const { items, removeItem, clear } = useCompare();
  const [details, setDetails] = useState<ProductDetail[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(items.map((item) => getProductBySlug(item.slug)))
      .then((results) => { if (!cancelled) setDetails(results); })
      .catch(() => { if (!cancelled) setDetails([]); });
    return () => { cancelled = true; };
  }, [items]);

  if (items.length < 2) {
    return (
      <main className="flex-1 bg-slate-50 px-4 py-16 text-slate-950 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white/80 p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-300">⇄</div>
          <h1 className="mt-5 text-2xl font-bold">Compare products</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Choose at least two products to compare their prices, ratings, sizes, and stock.</p>
          <Link href="/shop" className="mt-6 inline-flex rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950">Browse products</Link>
        </div>
      </main>
    );
  }

  const rows = [
    { label: "Brand", value: (product: ProductDetail) => product.brand.name },
    { label: "Category", value: (product: ProductDetail) => product.category.name },
    { label: "Price", value: (product: ProductDetail) => `Rs ${Number(product.current_price).toLocaleString()}` },
    { label: "Rating", value: (product: ProductDetail) => product.average_rating === null ? "New" : `${product.average_rating.toFixed(1)} / 5` },
    { label: "Available sizes", value: (product: ProductDetail) => Array.from(new Set(product.variants.map((variant) => `${variant.size.system} ${variant.size.value}`))).join(", ") || "Not listed" },
    { label: "Stock status", value: (product: ProductDetail) => product.is_in_stock ? "In stock" : "Out of stock" },
    { label: "Material", value: (product: ProductDetail) => product.material || "Not listed" },
    { label: "Sole", value: (product: ProductDetail) => product.sole_type || "Not listed" },
  ];

  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-10 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Product tools</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Compare products</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Compare up to three products side by side.</p></div>
          <button type="button" onClick={clear} className="text-xs font-semibold text-slate-500 hover:text-red-600">Clear comparison</button>
        </header>

        <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="min-w-[680px]">
            <div className="grid gap-px bg-slate-200 dark:bg-white/10" style={{ gridTemplateColumns: `150px repeat(${items.length}, minmax(220px, 1fr))` }}>
              <div className="bg-white p-4 dark:bg-slate-950" />
              {items.map((item) => (
                <div key={item.id} className="bg-white p-4 dark:bg-slate-950">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/10">{item.thumbnail && <Image src={item.thumbnail} alt={item.name} fill sizes="240px" className="object-cover" />}</div>
                  <h2 className="mt-3 line-clamp-2 text-sm font-bold">{item.name}</h2>
                  <div className="mt-3 flex items-center justify-between gap-2"><Link href={`/products/${item.slug}`} className="text-xs font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">View product</Link><button type="button" onClick={() => removeItem(item.id)} className="text-xs text-slate-400 hover:text-red-600">Remove</button></div>
                </div>
              ))}
              {rows.map((row) => <div key={row.label} className="contents"><div className="bg-slate-50 p-4 text-xs font-bold text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">{row.label}</div>{details.map((product) => <div key={`${row.label}-${product.id}`} className="bg-white p-4 text-sm dark:bg-slate-950">{row.value(product)}</div>)}</div>)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
