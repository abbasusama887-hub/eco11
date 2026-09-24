"use client";

import Image from "next/image";
import Link from "next/link";
import { useWishlist, type WishlistItem } from "@/app/context/WishlistContext";
import { useCart } from "@/app/context/CartContext";
import NotifyMeForm from "@/app/components/NotifyMeForm";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useState } from "react";

export default function WishlistPage() {
  const { items } = useWishlist();

  if (items.length === 0) {
    return (
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-50 px-4 py-24 text-center dark:bg-slate-950">
        <div className="pointer-events-none absolute -top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 px-6 py-12 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
        {/* Empty heart */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-300/20 dark:bg-rose-300/10">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-red-400">
            <path d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 5.3 5 5 0 0 1 21 8.5C21 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          Your wishlist is empty
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Save products you love and find them here later.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        >
          Explore products
          <ArrowIcon />
        </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex-1 overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_12%_10%,rgba(34,211,238,0.08),transparent_32%),radial-gradient(circle_at_92%_18%,rgba(37,99,235,0.06),transparent_28%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Saved for later</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            My Wishlist
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {items.length} {items.length === 1 ? "item" : "items"} saved
          </p>
        </div>
        <Link
          href="/shop"
          className="group inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:border-cyan-300/30 dark:hover:text-cyan-200"
        >
          Continue shopping
          <ArrowIcon className="transition-transform group-hover:translate-x-1" />
        </Link>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <WishlistCard key={item.productId} item={item} />
        ))}
      </div>
      </div>
    </main>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/* ── Individual wishlist card ─────────────────────────────────────────────── */

function WishlistCard({ item }: { item: WishlistItem }) {
  const { removeItem } = useWishlist();
  const { addItem, items: cartItems } = useCart();
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const alreadyInCart = cartItems.some(
    (c) => item.variantId !== undefined && c.variantId === item.variantId,
  );

  function handleMoveToCart() {
    if (!item.variantId || !item.rememberedSize || !item.rememberedColor) return;
    addItem({
      variantId: item.variantId,
      productSlug: item.productSlug,
      productName: item.productName,
      brandName: item.brandName,
      thumbnail: item.thumbnail,
      size: item.rememberedSize,
      color: item.rememberedColor,
      unitPrice: item.currentPrice,
      maxStock: item.maxStock ?? 1,
    });
    removeItem(item.productId);
  }

  const canMoveToCart =
    item.isInStock &&
    !!item.variantId &&
    !!item.rememberedSize &&
    !!item.rememberedColor;

  const hasDiscount = item.discountPercent > 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Image */}
      <Link href={`/products/${item.productSlug}`} className="relative block aspect-[4/3] overflow-hidden bg-zinc-50 dark:bg-zinc-800">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.productName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">👟</div>
        )}

        {!item.isInStock && (
          <span className="absolute left-3 top-3 rounded-full bg-zinc-900/80 px-2.5 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
        {hasDiscount && item.isInStock && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
            -{item.discountPercent}%
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {item.brandName}
        </span>
        <Link href={`/products/${item.productSlug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-50">
            {item.productName}
          </h3>
        </Link>

        {/* Remembered size/color pill */}
        {(item.rememberedSize || item.rememberedColor) && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {[item.rememberedSize, item.rememberedColor].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Rs {Number(item.currentPrice).toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-xs text-zinc-400 line-through">
              Rs {Number(item.price).toLocaleString()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          {/* Move to cart — only if variant info is available */}
          {canMoveToCart ? (
            <button
              type="button"
              onClick={handleMoveToCart}
              disabled={alreadyInCart}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
            >
              {alreadyInCart ? "In cart ✓" : "Move to cart"}
            </button>
          ) : (
            /* No variant info — link to PDP to pick size/color */
            <Link
              href={`/products/${item.productSlug}`}
              className="flex-1 rounded-lg border border-zinc-200 py-2 text-center text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
            >
              {item.isInStock ? "Select size" : "View product"}
            </Link>
          )}

          {/* Remove */}
          <button
            type="button"
            onClick={() => setConfirmingRemoval(true)}
            aria-label="Remove from wishlist"
            className="flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-zinc-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-zinc-700 dark:hover:border-red-800 dark:hover:bg-red-950/30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Notify-me form — only for out-of-stock items */}
        {!item.isInStock && (
          <div className="mt-3">
            <NotifyMeForm
              productId={item.productId}
              variantId={item.variantId}
              label="Notify me when back in stock"
            />
          </div>
        )}
      </div>
      {confirmingRemoval && (
        <ConfirmDialog
          title="Remove from wishlist?"
          description={`${item.productName} will be removed from your saved products.`}
          confirmLabel="Remove"
          onConfirm={() => { removeItem(item.productId); setConfirmingRemoval(false); }}
          onCancel={() => setConfirmingRemoval(false)}
        />
      )}
    </div>
  );
}
