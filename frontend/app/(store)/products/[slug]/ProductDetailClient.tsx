"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ProductDetail } from "@/app/types/product";
import type { Product } from "@/app/types/product";
import { getProducts, submitReview } from "@/app/lib/api";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import NotifyMeForm from "@/app/components/NotifyMeForm";
import ProductCard from "@/app/components/ProductCard";
import CompareButton from "@/app/components/CompareButton";
import ProductShare from "@/app/components/ProductShare";
import { STORE } from "@/app/lib/store";

export default function ProductDetailClient({ product }: { product: ProductDetail }) {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const router = useRouter();
  const wishlisted = isWishlisted(product.id);

  const galleryImages = useMemo(() => {
    const extra = product.images.map((img) => img.image);
    return product.thumbnail ? [product.thumbnail, ...extra] : extra;
  }, [product.images, product.thumbnail]);

  const [activeImage, setActiveImage] = useState(galleryImages[0] ?? null);
  const [imageFailed, setImageFailed] = useState(false);

  const sizes = useMemo(() => {
    const map = new Map<number, string>();
    product.variants.forEach((v) => map.set(v.size.id, `${v.size.system} ${v.size.value}`));
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [product.variants]);

  const colors = useMemo(() => {
    const map = new Map<number, { name: string; hex: string }>();
    product.variants.forEach((v) => map.set(v.color.id, { name: v.color.name, hex: v.color.hex_code }));
    return Array.from(map, ([id, val]) => ({ id, ...val }));
  }, [product.variants]);

  const [selectedSize, setSelectedSize] = useState<number | null>(sizes[0]?.id ?? null);
  const [selectedColor, setSelectedColor] = useState<number | null>(colors[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [storeProductCount, setStoreProductCount] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: "", email: "", rating: 5, title: "", comment: "" });
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const selectedVariant = useMemo(
    () =>
      product.variants.find(
        (v) => v.size.id === selectedSize && v.color.id === selectedColor,
      ) ?? null,
    [product.variants, selectedSize, selectedColor],
  );

  const currentPrice = selectedVariant?.effective_price ?? product.current_price;
  const isSizeAvailable = (sizeId: number) => product.variants.some((variant) => variant.size.id === sizeId && variant.is_active && variant.stock_quantity > 0 && (!selectedColor || variant.color.id === selectedColor));
  const isColorAvailable = (colorId: number) => product.variants.some((variant) => variant.color.id === colorId && variant.is_active && variant.stock_quantity > 0 && (!selectedSize || variant.size.id === selectedSize));

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock_quantity < 1) return;

    addSelectedVariantToCart();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const addSelectedVariantToCart = () => {
    if (!selectedVariant || selectedVariant.stock_quantity < 1) return false;

    addItem({
      variantId: selectedVariant.id,
      productSlug: product.slug,
      productName: product.name,
      brandName: product.brand.name,
      thumbnail: product.thumbnail,
      size: `${selectedVariant.size.system} ${selectedVariant.size.value}`,
      color: selectedVariant.color.name,
      unitPrice: selectedVariant.effective_price,
      maxStock: selectedVariant.stock_quantity,
    }, quantity);
    return true;
  };

  const handleBuyNow = () => {
    if (addSelectedVariantToCart()) router.push("/checkout");
  };

  const handleWishlist = () => {
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
      // Remember the currently-selected size/color so the wishlist page
      // can pre-fill "Move to cart"
      variantId: selectedVariant?.id,
      rememberedSize: selectedVariant
        ? `${selectedVariant.size.system} ${selectedVariant.size.value}`
        : undefined,
      rememberedColor: selectedVariant?.color.name,
      maxStock: selectedVariant?.stock_quantity,
    });
  };

  const hasDiscount = product.discount_percent > 0;

  function moveImage(direction: -1 | 1) {
    if (galleryImages.length < 2) return;
    const currentIndex = activeImage ? galleryImages.indexOf(activeImage) : 0;
    const nextIndex = (currentIndex + direction + galleryImages.length) % galleryImages.length;
    setActiveImage(galleryImages[nextIndex]);
    setImageFailed(false);
    setZoomed(false);
  }

  async function handleReviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewMessage(null);
    setReviewError(null);
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) {
      setReviewError("Please add your name and review before submitting.");
      return;
    }
    setReviewSubmitting(true);
    try {
      await submitReview(product.slug, {
        customer_name: reviewForm.name.trim(),
        customer_email: reviewForm.email.trim(),
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
      });
      setReviewForm({ name: "", email: "", rating: 5, title: "", comment: "" });
      setReviewMessage("Thanks. Your review was submitted for moderation.");
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "We could not submit your review.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getProducts({ category: product.category.slug, limit: 5 }),
      getProducts({ limit: 1 }),
    ])
      .then(([relatedData, storeData]) => {
        if (!cancelled) {
          setRelatedProducts(relatedData.results.filter((item) => item.id !== product.id).slice(0, 4));
          setStoreProductCount(storeData.count);
        }
      })
      .catch(() => {
        if (!cancelled) setRelatedProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product.category.slug, product.id]);

  return (
    <main className="relative flex-1 overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.08),transparent_32%),radial-gradient(circle_at_92%_18%,rgba(37,99,235,0.06),transparent_28%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="transition-colors hover:text-cyan-700 dark:hover:text-cyan-200">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop" className="transition-colors hover:text-cyan-700 dark:hover:text-cyan-200">
          Shop
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-medium text-slate-900 dark:text-slate-200">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12">
        {/* Gallery */}
        <section aria-label="Product gallery">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_18px_45px_rgba(2,8,23,0.24)]">
            {activeImage && !imageFailed ? (
              <button type="button" onClick={() => setZoomed((value) => !value)} className="absolute inset-0 cursor-zoom-in overflow-hidden" aria-label={zoomed ? "Reset product image zoom" : "Zoom product image"}>
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className={`object-cover transition-transform duration-500 ${zoomed ? "scale-150 cursor-zoom-out" : "hover:scale-[1.02]"}`}
                  onError={() => setImageFailed(true)}
                  priority
                />
              </button>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
                No image
              </div>
            )}
            {galleryImages.length > 1 && (
              <>
                <button type="button" onClick={() => moveImage(-1)} aria-label="Previous product image" className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm transition hover:bg-white">‹</button>
                <button type="button" onClick={() => moveImage(1)} aria-label="Next product image" className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm transition hover:bg-white">›</button>
              </>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {galleryImages.map((img) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => { setActiveImage(img); setImageFailed(false); }}
                    aria-label={`View image ${galleryImages.indexOf(img) + 1}`}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    activeImage === img
                        ? "border-cyan-500 shadow-[0_0_0_3px_rgba(34,211,238,0.15)]"
                        : "border-slate-200 opacity-70 hover:opacity-100 dark:border-white/10"
                  }`}
                >
                  <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Details */}
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
            {product.brand.name}
          </span>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{product.category.name}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {product.name}
          </h1>

          {product.average_rating !== null && (
            <div className="mt-4 flex items-center gap-1.5 text-sm">
              <span className="text-amber-400" aria-label={`${product.average_rating} out of 5 stars`}>★</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {product.average_rating.toFixed(1)}
              </span>
              <span className="text-slate-400">({product.reviews.length} reviews)</span>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Rs {Number(currentPrice).toLocaleString()}
            </span>
            {hasDiscount && (
              <>
                <span className="text-base text-slate-400 line-through">
                  Rs {Number(product.price).toLocaleString()}
                </span>
                <span className="rounded-lg border border-rose-300/30 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
                  -{product.discount_percent}%
                </span>
              </>
            )}
          </div>

          {product.short_description && (
            <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {product.short_description}
            </p>
          )}

          {/* Color selector */}
          {colors.length > 0 && (
            <div className="mt-7">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Color{selectedColor && colors.find((c) => c.id === selectedColor) ? (
                  <span className="ml-1.5 font-normal text-slate-500">
                    — {colors.find((c) => c.id === selectedColor)?.name}
                  </span>
                ) : null}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    aria-label={color.name}
                    onClick={() => setSelectedColor(color.id)}
                    disabled={!isColorAvailable(color.id)}
                    className={`h-9 w-9 rounded-full border-2 transition-transform ${
                      selectedColor === color.id
                        ? "scale-110 border-cyan-500 shadow-[0_0_0_3px_rgba(34,211,238,0.15)]"
                        : "border-slate-200 hover:scale-105 dark:border-white/15"
                    } ${!isColorAvailable(color.id) ? "cursor-not-allowed opacity-30 grayscale" : ""}`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {sizes.length > 0 && (
            <div className="mt-7">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Size</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size.id)}
                    disabled={!isSizeAvailable(size.id)}
                    className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                      selectedSize === size.id
                        ? "border-cyan-500 bg-cyan-500 text-slate-950"
                        : "border-slate-200 text-slate-700 hover:border-cyan-400 dark:border-white/15 dark:text-slate-300"
                    } ${!isSizeAvailable(size.id) ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock status */}
          <p className="mt-5 text-sm">
            {!selectedVariant && <span className="text-slate-500 dark:text-slate-400">Select a size and color.</span>}
            {selectedVariant?.stock_status === "out_of_stock" && (
              <span className="font-medium text-red-600 dark:text-red-400">Out of stock</span>
            )}
            {selectedVariant?.stock_status === "low_stock" && (
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Only {selectedVariant.stock_quantity} left
              </span>
            )}
            {selectedVariant?.stock_status === "in_stock" && (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">In stock</span>
            )}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Estimated delivery: 3-5 business days.</p>

          {/* Notify-me form — shown when selected variant is out of stock */}
          {selectedVariant?.stock_status === "out_of_stock" && (
            <div className="mt-4">
              <NotifyMeForm
                productId={product.id}
                variantId={selectedVariant.id}
              />
            </div>
          )}

          {/* Notify-me form — no variant selected yet but whole product is OOS */}
          {!selectedVariant && !product.is_in_stock && (
            <div className="mt-4">
              <NotifyMeForm productId={product.id} />
            </div>
          )}

          {/* Quantity + Add to cart + Wishlist */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.05]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-cyan-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-cyan-200"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(q + 1, selectedVariant?.stock_quantity ?? 1))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-cyan-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-cyan-200"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock_quantity < 1}
              className="flex-1 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:disabled:bg-slate-800"
            >
              {justAdded ? "Added ✓" : "Add to cart"}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!selectedVariant || selectedVariant.stock_quantity < 1}
              className="flex-1 rounded-xl border border-cyan-500 bg-transparent px-6 py-3 text-sm font-bold text-cyan-700 transition-all hover:-translate-y-0.5 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 dark:text-cyan-300 dark:hover:bg-cyan-400/10 dark:disabled:border-white/10 dark:disabled:text-slate-600"
            >
              Buy now
            </button>

            {/* Wishlist toggle */}
            <button
              type="button"
              onClick={handleWishlist}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                wishlisted
                  ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                  : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-cyan-300/30 dark:hover:bg-cyan-300/10"
              }`}
            >
              <HeartIcon filled={wishlisted} />
              <span className="hidden sm:inline">
                {wishlisted ? "Wishlisted" : "Wishlist"}
              </span>
            </button>
            <CompareButton product={product} />
          </div>
            <ProductShare productName={product.name} slug={product.slug} />

          {/* Attributes */}
          {(product.material || product.sole_type) && (
            <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-200 pt-6 text-sm dark:border-white/10">
              {product.material && (
                <>
                  <dt className="text-slate-500 dark:text-slate-400">Material</dt>
                  <dd className="text-slate-900 dark:text-slate-100">{product.material}</dd>
                </>
              )}
              {product.sole_type && (
                <>
                  <dt className="text-slate-500 dark:text-slate-400">Sole</dt>
                  <dd className="text-slate-900 dark:text-slate-100">{product.sole_type}</dd>
                </>
              )}
            </dl>
          )}

          {product.description && (
            <div className="mt-7 border-t border-slate-200 pt-6 dark:border-white/10">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Description
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {product.description}
              </p>
            </div>
          )}

          <section className="mt-7 border-t border-slate-200 pt-6 dark:border-white/10" aria-labelledby="store-information-heading">
            <div className="flex items-start gap-3">
              <img src={STORE.logo} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="store-information-heading" className="text-sm font-bold text-slate-900 dark:text-white">{STORE.name}</h2>
                  {STORE.verified && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Verified store</span>}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">One store, one Bazar experience.</p>
              </div>
            </div>
            <dl className="mt-4 grid gap-2 text-xs text-slate-600 dark:text-slate-400 sm:grid-cols-2">
              <div><dt className="font-semibold text-slate-900 dark:text-slate-200">Store rating</dt><dd className="mt-0.5">Not yet rated</dd></div>
              {storeProductCount !== null && <div><dt className="font-semibold text-slate-900 dark:text-slate-200">Available products</dt><dd className="mt-0.5">{storeProductCount}</dd></div>}
              <div><dt className="font-semibold text-slate-900 dark:text-slate-200">Delivery</dt><dd className="mt-0.5">{STORE.deliveryInformation}</dd></div>
            </dl>
            <Link href="/store" className="mt-4 inline-flex rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400">View store</Link>
          </section>
        </section>
      </div>

      {/* Reviews */}
      <section className="mt-16 border-t border-slate-200 pt-10 dark:border-white/10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Customer feedback</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Reviews <span className="text-slate-400">({product.reviews.length})</span></h2>
          </div>
          {product.average_rating !== null && <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><span className="text-2xl font-bold text-slate-950 dark:text-white">{product.average_rating.toFixed(1)}</span><span className="text-amber-400">★</span><span>Average rating</span></div>}
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {product.reviews.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">No reviews yet. Be the first to share your experience.</p>}
            {product.reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-900 dark:text-white">{review.customer_name}</span><span className="text-sm tracking-wide text-amber-400" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}</span></div>
                {review.is_verified_purchase && <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Verified purchase</span>}
                {review.title && <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">{review.title}</p>}
                {review.comment && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{review.comment}</p>}
              </div>
            ))}
          </div>
          <form onSubmit={handleReviewSubmit} className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Write a review</h3>
            <div className="mt-4 space-y-3">
              <input required value={reviewForm.name} onChange={(event) => setReviewForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
              <input type="email" value={reviewForm.email} onChange={(event) => setReviewForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email (optional)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
              <select value={reviewForm.rating} onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select>
              <input value={reviewForm.title} onChange={(event) => setReviewForm((current) => ({ ...current, title: event.target.value }))} placeholder="Review title (optional)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
              <textarea required rows={4} value={reviewForm.comment} onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))} placeholder="Tell shoppers what you think" className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
              {reviewMessage && <p className="text-xs text-emerald-700 dark:text-emerald-300">{reviewMessage}</p>}
              {reviewError && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{reviewError}</p>}
              <button type="submit" disabled={reviewSubmitting} className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60">{reviewSubmitting ? "Submitting..." : "Submit review"}</button>
              <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">Reviews are moderated. Verified purchase status is assigned by the store, never by the form.</p>
            </div>
          </form>
        </div>
      </section>
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-slate-200 pt-10 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">From the same category</span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">You may also like</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">More styles from {product.category.name}.</p>
          <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
      </div>
    </main>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 5.3 5 5 0 0 1 21 8.5C21 14.5 12 21 12 21Z" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 5.3 5 5 0 0 1 21 8.5C21 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
