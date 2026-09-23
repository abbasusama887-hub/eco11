"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/app/context/WishlistContext";
import type { Product } from "@/app/types/product";

export default function ProductCard({ product }: { product: Product }) {
  const hasDiscount = product.discount_percent > 0;
  const { toggleItem, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const router = useRouter();

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
    router.push(`/products/${product.slug}`);
  }

  return (
    <article className="group relative flex min-h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 text-white shadow-[0_10px_28px_rgba(2,8,23,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:shadow-[0_18px_38px_rgba(2,8,23,0.34),0_0_24px_rgba(34,211,238,0.08)]">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-900">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-400 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
            No image
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/75 to-transparent" />

        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-lg border border-white/15 bg-red-500/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-lg backdrop-blur-md">
            -{product.discount_percent}%
          </span>
        )}

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
          <ActionButton label="View Product" onClick={openProduct}>
            <EyeIcon />
          </ActionButton>
          <ActionButton label="Add to Cart" onClick={openProduct}>
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

        {product.average_rating !== null && (
          <div className="flex items-center gap-1 text-xs text-amber-500">
            <span>★</span>
            <span className="text-slate-400">
              {product.average_rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </article>
  );
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