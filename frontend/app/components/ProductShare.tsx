"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

export default function ProductShare({ productName, slug }: { productName: string; slug: string }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  function productUrl() {
    return `${window.location.origin}/products/${slug}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(productUrl());
      setCopied(true);
      showToast({ title: "Link copied", description: "The product link is ready to share." });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast({ title: "Could not copy link", description: "Copy the product URL from your browser instead.", variant: "error" });
    }
  }

  const encodedUrl = typeof window === "undefined" ? "" : encodeURIComponent(productUrl());
  const encodedTitle = encodeURIComponent(productName);

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-5 dark:border-white/10">
      <span className="mr-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Share</span>
      <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:text-slate-300">WhatsApp</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-300">Facebook</a>
      <button type="button" onClick={copyLink} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:text-slate-300">{copied ? "Copied" : "Copy link"}</button>
    </div>
  );
}
