"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import ConfirmDialog from "@/app/components/ConfirmDialog";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const { toggleItem } = useWishlist();
  const [pendingRemoval, setPendingRemoval] = useState<(typeof items)[number] | null>(null);

  function saveForLater(item: (typeof items)[number]) {
    toggleItem({
      productId: item.variantId,
      productSlug: item.productSlug,
      productName: item.productName,
      brandName: item.brandName,
      thumbnail: item.thumbnail,
      price: item.unitPrice,
      currentPrice: item.unitPrice,
      discountPercent: 0,
      isInStock: item.maxStock > 0,
      rememberedSize: item.size,
      rememberedColor: item.color,
      variantId: item.variantId,
      maxStock: item.maxStock,
    });
    removeItem(item.variantId);
  }

  if (items.length === 0) {
    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-50 px-4 py-20 text-center dark:bg-slate-950">
        <div className="pointer-events-none absolute -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white/75 px-6 py-12 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-600 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200">
            <CartIcon />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Your cart is empty</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Add a pair of shoes to get started.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        >
          Browse shoes
          <ArrowIcon />
        </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <main className="relative flex-1 overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_12%_10%,rgba(34,211,238,0.08),transparent_32%),radial-gradient(circle_at_92%_18%,rgba(37,99,235,0.06),transparent_28%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Your selection</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Shopping cart</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Review your pairs before checkout.</p>
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section aria-label="Cart items" className="rounded-3xl border border-slate-200 bg-white/75 p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
            <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Items in your cart</h2>
              <Link href="/shop" className="text-xs font-semibold text-cyan-700 transition-colors hover:text-cyan-500 dark:text-cyan-300">Continue shopping</Link>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-white/10">
        {items.map((item) => (
          <article key={item.variantId} className="flex flex-col gap-4 py-5 transition-colors first:pt-4 last:pb-2 sm:flex-row">
            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:h-28 sm:w-28">
              {item.thumbnail ? (
                <Image src={item.thumbnail} alt={item.productName} fill sizes="112px" className="object-cover" />
              ) : null}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300/80">
                    {item.brandName}
                  </p>
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="mt-1 block text-sm font-semibold text-slate-950 transition-colors hover:text-cyan-700 dark:text-white dark:hover:text-cyan-200"
                  >
                    {item.productName}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.size} · {item.color}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingRemoval(item)}
                  aria-label="Remove from cart"
                  title="Remove from cart"
                  className="rounded-lg p-2 text-slate-400 transition-all hover:scale-105 hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-400/10"
                >
                  <TrashIcon />
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 sm:mt-auto sm:pt-4">
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.05]">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${item.productName}`}
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-cyan-200"
                  >
                    −
                  </button>
                  <span aria-live="polite" className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${item.productName}`}
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-cyan-200"
                  >
                    +
                  </button>
                </div>
                <button type="button" onClick={() => saveForLater(item)} className="text-xs font-medium text-slate-500 transition-colors hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-200">
                  Save for later
                </button>
                <span className="ml-auto text-base font-bold text-slate-950 dark:text-white">
                  Rs {(item.unitPrice * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
          </article>
        ))}
            </div>
          </section>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-white/15 bg-slate-950/[0.92] p-6 text-white shadow-[0_18px_44px_rgba(2,8,23,0.24),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl">
              <h2 className="text-lg font-semibold">Order summary</h2>
              <p className="mt-1 text-xs text-slate-400">Your final delivery options are confirmed at checkout.</p>
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>Rs {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-slate-500"><span>Shipping</span><span>Calculated at checkout</span></div>
                <div className="flex justify-between text-slate-500"><span>Tax</span><span>Calculated at checkout</span></div>
              </div>
              <div className="my-6 border-t border-white/10" />
              <div className="flex items-end justify-between gap-4">
                <span className="text-sm font-medium text-slate-300">Total</span>
                <span className="text-2xl font-bold tracking-tight text-white">Rs {subtotal.toLocaleString()}</span>
              </div>
              <Link
                href="/checkout"
                className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-cyan-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Proceed to checkout
                <ArrowIcon className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/shop" className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-200">
                <BackIcon /> Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
    {pendingRemoval && (
      <ConfirmDialog
        title="Remove this item?"
        description={`${pendingRemoval.productName} will be removed from your cart.`}
        confirmLabel="Remove"
        onConfirm={() => {
          removeItem(pendingRemoval.variantId);
          setPendingRemoval(null);
        }}
        onCancel={() => setPendingRemoval(null)}
      />
    )}
    </>
  );
}

function CartIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h2l1.5 10.5a2 2 0 0 0 2 1.7h7.4a2 2 0 0 0 2-1.6L20.5 8H7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="20" r="1" fill="currentColor" /><circle cx="17" cy="20" r="1" fill="currentColor" /></svg>;
}

function TrashIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7l1-3h4l1 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function BackIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
