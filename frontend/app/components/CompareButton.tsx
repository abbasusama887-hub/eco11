"use client";

import Link from "next/link";
import type { Product } from "@/app/types/product";
import { useCompare } from "@/app/context/CompareContext";

export default function CompareButton({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem, removeItem, isCompared } = useCompare();
  const compared = isCompared(product.id);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => compared ? removeItem(product.id) : addItem(product)}
        className={compact
          ? "rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:text-slate-300"
          : "rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-white/10 dark:text-slate-300 dark:hover:bg-cyan-300/10"}
      >
        {compared ? "Remove compare" : "Compare"}
      </button>
      {compared && <Link href="/compare" className="text-[10px] font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">View</Link>}
    </div>
  );
}
