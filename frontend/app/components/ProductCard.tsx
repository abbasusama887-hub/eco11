"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import type { Product } from "@/app/types/product";
import CompareButton from "@/app/components/CompareButton";

const PRODUCT_SIZES = ["6", "7", "8", "9", "10", "11"];

export default function ProductCard({ product }: { product: Product }) {
  const hasDiscount = product.discount_percent > 0;
  const { toggleItem, isWishlisted } = useWishlist();
  const { addItem } = useCart();
  const wishlisted = isWishlisted(product.id);
  const router = useRouter();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(PRODUCT_SIZES[2]);
  const [imageFailed, setImageFailed] = useState(false);
  const badges = getProductBadges(product);

  function persistRecentlyViewed() {
    try {
      const raw = window.localStorage.getItem("bazar_recently_viewed");
      const current = raw ? (JSON.parse(raw) as number[]) : [];
      const next = [product.id, ...current.filter((id) => id !== product.id)].slice(0, 6);
      window.localStorage.setItem("bazar_recently_viewed", JSON.stringify(next));
    } catch {
      // Ignore storage issues gracefully.
    }
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      brandName: product.brand.name,
      thumbnail: product.thumbnail,
      price: Number(product.price),
      currentPrice: Number(product.current_price),
      discountPercent: product.discount_percent,
      isInStock: product.is_in_stock,
    });
  }

  function openProduct(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    persistRecentlyViewed();
    router.push(`/products/${product.slug}`);
  }

  function handleQuickAdd() {
    const variantId = Number(`${product.id}${selectedSize}`);
    addItem(
      {
        variantId,
        productSlug: product.slug,
        productName: product.name,
        brandName: product.brand.name,
        thumbnail: product.thumbnail,
        size: selectedSize,
        color: "Default",
        unitPrice: Number(product.current_price),
        maxStock: 12,
      },
      1,
    );
    setQuickViewOpen(false);
  }

  const stockStatus = product.stock_status === "out_of_stock" || !product.is_in_stock ? "Out of stock" : product.stock_status === "low_stock" ? "Low stock" : "In stock";

  return (
    <>
      <article className="group relative flex min-h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 text-white shadow-[0_10px_28px_rgba(2,8,23,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:shadow-[0_18px_38px_rgba(2,8,23,0.34),0_0_24px_rgba(34,211,238,0.08)]">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-900">
          {product.thumbnail && !imageFailed ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-400 ease-out group-hover:scale-[1.03]"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
              No image
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/75 to-transparent" />

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span key={badge.label} className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white ${badge.tone}`}>
                {badge.label}
              </span>
            ))}
          </div>

          {!product.is_in_stock && (
            <span className="absolute bottom-3 left-3 rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              Out of stock
            </span>
          )}

          <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-100 transition-all duration-300 sm:opacity-75 sm:group-hover:opacity-100">
            <ActionButton
              label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              onClick={handleWishlist}
            >
              <HeartIcon filled={wishlisted} />
            </ActionButton>
            <ActionButton
              label="Quick View"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                persistRecentlyViewed();
                setQuickViewOpen(true);
              }}
            >
              <EyeIcon />
            </ActionButton>
            <ActionButton
              label="Add to Cart"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const variantId = Number(`${product.id}${selectedSize}`);
                addItem(
                  {
                    variantId,
                    productSlug: product.slug,
                    productName: product.name,
                    brandName: product.brand.name,
                    thumbnail: product.thumbnail,
                    size: selectedSize,
                    color: "Default",
                    unitPrice: Number(product.current_price),
                    maxStock: 12,
                  },
                  1,
                );
              }}
            >
              <CartIcon />
            </ActionButton>
            <ActionButton label="Buy Now" onClick={openProduct}>
              <BoltIcon />
            </ActionButton>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <Link href={`/products/${product.slug}`} className="block min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">
              {product.brand.name}
            </span>
            <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-white transition-colors group-hover:text-cyan-100">
              {product.name}
            </h3>
          </Link>

          <div className="mt-auto flex items-center gap-2 pt-2">
            <span className="text-base font-bold tracking-tight text-white">
              Rs {Number(product.current_price).toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-500 line-through">
                Rs {Number(product.price).toLocaleString()}
              </span>
            )}
            {hasDiscount && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-cyan-300">{product.discount_percent}% off</span>}
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            {product.average_rating !== null && (
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <span>★</span>
                <span className="text-slate-400">{product.average_rating.toFixed(1)}</span>
              </div>
            )}
            <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${product.is_in_stock ? "text-emerald-300" : "text-slate-400"}`}>
              {stockStatus}
            </span>
          </div>
          <CompareButton product={product} compact />
        </div>
      </article>

      {quickViewOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-950 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <div className="relative h-56 bg-slate-100">
              {product.thumbnail ? (
                <Image src={product.thumbnail} alt={product.name} fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-slate-400">👟</div>
              )}
              <button type="button" aria-label="Close quick view" onClick={() => setQuickViewOpen(false)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm">✕</button>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">{product.brand.name}</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-950">{product.name}</h3>
                </div>
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-700">{stockStatus}</span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                <span className="text-amber-500">★</span>
                <span>{product.average_rating !== null ? product.average_rating.toFixed(1) : "New"}</span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-lg font-bold text-slate-950">Rs {Number(product.current_price).toLocaleString()}</span>
                {hasDiscount && <span className="text-sm text-slate-500 line-through">Rs {Number(product.price).toLocaleString()}</span>}
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Available sizes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRODUCT_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-xl border px-2 text-sm transition-colors ${
                        selectedSize === size
                          ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button type="button" onClick={handleQuickAdd} className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400">
                  Add to cart
                </button>
                <button type="button" onClick={openProduct} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  View details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getProductBadges(product: Product) {
  const badges: { label: string; tone: string }[] = [];

  if (product.is_new_arrival) badges.push({ label: "New", tone: "bg-cyan-500/90" });
  if (product.discount_percent > 0) badges.push({ label: "Sale", tone: "bg-red-500/90" });
  if (product.is_featured) badges.push({ label: "Best Seller", tone: "bg-amber-500/90" });
  if (!product.is_in_stock) badges.push({ label: "Out of Stock", tone: "bg-slate-800/90" });

  return badges.slice(0, 3);
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-slate-950/55 text-slate-200 shadow-[0_6px_16px_rgba(2,8,23,0.28),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-lg transition-all duration-200 hover:scale-105 hover:border-cyan-300/40 hover:bg-cyan-300/20 hover:text-cyan-100 hover:shadow-[0_8px_20px_rgba(34,211,238,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      {children}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-500" aria-hidden="true">
      <path d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 5.3 5 5 0 0 1 21 8.5C21 14.5 12 21 12 21Z" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-zinc-400" aria-hidden="true">
      <path d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 5.3 5 5 0 0 1 21 8.5C21 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h2l1.5 10.5a2 2 0 0 0 2 1.7h7.4a2 2 0 0 0 2-1.6L20.5 8H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1" fill="currentColor" />
      <circle cx="17" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}