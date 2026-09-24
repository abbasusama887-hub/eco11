"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/app/context/WishlistContext";
import type { HeroSlide } from "@/app/lib/api";
import type { Product } from "@/app/types/product";

// ─── Fallback slides shown when no DB slides exist ────────────────────────

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: -1,
    badge: "New Arrivals",
    headline: "Upgrade Your Everyday",
    sub: "Top brands. Great prices. Better you.",
    cta_label: "Shop Now",
    cta_href: "/shop",
    bg_image: null,
    accent_color: "#2563eb",
    display_order: 0,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────

interface Props {
  products: Product[];
  heroSlides: HeroSlide[];
  loadError: string | null;
}

// ─── Main component ───────────────────────────────────────────────────────

export default function HomeClient({ products, heroSlides, loadError }: Props) {
  const slides = heroSlides.length > 0 ? heroSlides : FALLBACK_SLIDES;
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slide = slides[activeSlide] ?? slides[0];
  const accentHex = slide.accent_color || "#2563eb";

  useEffect(() => {
    if (slides.length < 2 || isPaused) return;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, [isPaused, slides.length]);

  function goToSlide(index: number) {
    setActiveSlide((index + slides.length) % slides.length);
  }

  return (
    <main className="relative overflow-hidden bg-white text-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.08),transparent_34%),radial-gradient(circle_at_88%_24%,rgba(37,99,235,0.06),transparent_30%)]" />
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section
        className="group/hero relative mx-2 h-[390px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-[0_18px_46px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:mx-3 sm:h-[480px] md:h-[560px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        {slides.map((currentSlide, index) => (
          <div
            key={currentSlide.id}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              index === activeSlide
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-[1.02] opacity-0"
            }`}
            aria-hidden={index !== activeSlide}
          >
            {currentSlide.bg_image ? (
              <Image
                src={currentSlide.bg_image}
                alt={currentSlide.headline}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${currentSlide.accent_color || "#2563eb"}22 0%, ${currentSlide.accent_color || "#2563eb"}66 100%)` }}
              />
            )}
          </div>
        ))}

        {/* Slide content — existing data presented in a glass panel */}
        <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center px-5 py-10 sm:px-10 md:px-16">
          <div className="w-full rounded-3xl border border-white/70 bg-white/75 p-5 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_45px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-8 md:max-w-xl">
            <span
              className="inline-flex w-fit items-center rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md sm:text-xs"
              style={{ backgroundColor: `${accentHex}bb` }}
            >
              {slide.badge}
            </span>

            <h1 className="mt-4 max-w-xl text-3xl font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
              {slide.headline}
            </h1>

            {slide.sub && (
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-700 sm:text-base">
                {slide.sub}
              </p>
            )}

            <Link
              href={slide.cta_href}
              className="group/cta mt-6 inline-flex w-fit items-center gap-2 rounded-xl border border-slate-900/10 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_12px_28px_rgba(34,211,238,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              style={{ backgroundColor: `${accentHex}dd` }}
            >
              {slide.cta_label}
              <svg className="transition-transform duration-300 group-hover/cta:translate-x-1" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => goToSlide(activeSlide - 1)}
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/75 text-slate-950 shadow-lg backdrop-blur-lg transition-all duration-200 hover:scale-105 hover:border-cyan-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:left-5"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => goToSlide(activeSlide + 1)}
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/75 text-slate-950 shadow-lg backdrop-blur-lg transition-all duration-200 hover:scale-105 hover:border-cyan-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:right-5"
            >
              <ChevronIcon direction="right" />
            </button>
            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3 py-2 backdrop-blur-lg">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === activeSlide ? "true" : undefined}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                    index === activeSlide ? "w-8 bg-cyan-600" : "w-2 bg-slate-300 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Featured Products ────────────────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-[1440px] px-4 py-14 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">
              <span className="h-px w-7 bg-cyan-500" />
              Trending now
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Featured Products
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              A considered edit of the latest styles, selected for every step.
            </p>
          </div>
          <Link
            href="/shop"
            className="group inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:border-cyan-300/30 dark:hover:text-cyan-200"
          >
            View all
            <svg className="transition-transform duration-200 group-hover:translate-x-1" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {loadError && (
          <p className="mb-8 rounded-2xl border border-red-200/80 bg-red-50/80 p-5 text-sm text-red-600 shadow-sm dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-400">
            Couldn&apos;t load products: {loadError}. Make sure the Django backend is running.
          </p>
        )}

        {!loadError && products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center dark:border-white/15 dark:bg-white/[0.03]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No featured products yet. Mark a product as &quot;Featured&quot; in the admin panel.
            </p>
          </div>
        )}

        {products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-5">
            {products.map((product) => (
              <ProductCardHome key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <FloatingChatButton />
    </main>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "m14.5 5-7 7 7 7" : "m9.5 5 7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────

function ProductCardHome({ product }: { product: Product }) {
  const { toggleItem, isWishlisted } = useWishlist();
  const router = useRouter();
  const hasDiscount = product.discount_percent > 0;
  const wishlisted = isWishlisted(product.id);
  const [imageFailed, setImageFailed] = useState(false);

  function handleWishlist(e: React.MouseEvent<HTMLButtonElement>) {
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

  function openProduct(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${product.slug}`);
  }

  return (
    <div className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-[0_18px_38px_rgba(15,23,42,0.15),0_0_24px_rgba(34,211,238,0.1)]">
      <div className="relative block aspect-[4/5] overflow-hidden bg-slate-100">
        {product.thumbnail && !imageFailed ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
            className="object-cover transition-transform duration-400 ease-out group-hover:scale-[1.03]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">No image</div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/35 to-transparent" />
        <Link
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name}`}
          className="absolute inset-0 z-0"
        />
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-lg border border-white/15 bg-red-500/90 px-2 py-1 text-[10px] font-bold tracking-wide text-white shadow-lg backdrop-blur-md">
            -{product.discount_percent}%
          </span>
        )}
        {!product.is_in_stock && (
          <span className="absolute bottom-3 left-3 rounded-lg border border-white/70 bg-white/85 px-2 py-1 text-[10px] font-medium text-slate-950 backdrop-blur-md">
            Out of stock
          </span>
        )}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 opacity-100 transition-opacity duration-300 sm:opacity-75 sm:group-hover:opacity-100">
          <HomeActionButton label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} onClick={handleWishlist}>
            <HeartIcon filled={wishlisted} />
          </HomeActionButton>
          <HomeActionButton label="View Product" onClick={openProduct}><EyeIcon /></HomeActionButton>
          <HomeActionButton label="Buy Now" onClick={openProduct}><BoltIcon /></HomeActionButton>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
          {product.brand.name}
        </span>
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-950 transition-colors group-hover:text-cyan-700">
            {product.name}
          </h3>
        </Link>

        {product.average_rating !== null && (
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i < Math.round(product.average_rating!) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
            <span className="text-[10px] text-slate-400">({product.average_rating.toFixed(1)})</span>
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="text-sm font-bold text-slate-950">
            Rs {Number(product.current_price).toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-slate-500 line-through">
              Rs {Number(product.price).toLocaleString()}
            </span>
          )}
          {hasDiscount && <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-cyan-700">{product.discount_percent}% off</span>}
        </div>

      </div>
    </div>
  );
}

function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <div
        className={`flex flex-col items-end gap-3 transition-all duration-300 ease-out ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <a
          href="https://wa.me/923047345026"
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-200/90 text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.12)] transition-all duration-200 hover:scale-105 hover:bg-slate-300 hover:text-slate-700"
          title="WhatsApp: 03047345026"
        >
          <WhatsAppIcon />
        </a>

        <a
          href="mailto:usama.developer.500@gmail.com"
          aria-label="Email us"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-200/90 text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.12)] transition-all duration-200 hover:scale-105 hover:bg-slate-300 hover:text-slate-700"
          title="Email: usama.developer.500@gmail.com"
        >
          <EmailIcon />
        </a>
      </div>

      <button
        type="button"
        aria-label={isOpen ? "Close chat options" : "Open chat options"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-200/95 text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all duration-300 hover:scale-105 hover:bg-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <ChatIcon isOpen={isOpen} />
      </button>
    </div>
  );
}

function HomeActionButton({
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
      className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-lg transition-all duration-200 hover:scale-105 hover:border-cyan-300/50 hover:bg-cyan-50 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      {children}
    </button>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.05 4.95A9.7 9.7 0 0 0 12.06 2C6.64 2 2.2 6.42 2.2 11.84a9.8 9.8 0 0 0 1.35 4.96L2 22l5.4-1.42a9.8 9.8 0 0 0 4.66 1.4h.01c5.42 0 9.83-4.42 9.83-9.84 0-2.62-1.02-5.09-2.85-6.9Zm-7 14.04h-.01c-1.2 0-2.38-.32-3.41-.93l-.24-.14-3.2.84.85-3.12-.16-.26A7.78 7.78 0 0 1 4.29 12c0-4.31 3.51-7.82 7.83-7.82a7.8 7.8 0 0 1 5.53 2.37 7.76 7.76 0 0 1 2.28 5.47c0 4.32-3.51 7.82-7.83 7.82Zm4.29-5.86c-.24-.12-1.41-.69-1.63-.77-.21-.08-.37-.12-.52.12-.15.24-.59.77-.73.93-.13.15-.27.17-.5.06-.24-.12-1.02-.37-1.94-1.19-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.36.11-.48.11-.11.24-.28.37-.42.12-.14.16-.24.24-.4.08-.15.04-.29-.02-.4-.06-.12-.52-1.26-.71-1.72-.18-.45-.37-.4-.52-.4h-.44c-.15 0-.39.06-.59.29-.2.24-.76.74-.76 1.81 0 1.07.78 2.1.89 2.25.11.16 1.53 2.35 3.72 3.28.52.22.92.35 1.24.45.52.17.99.15 1.37.09.42-.06 1.41-.58 1.61-1.13.21-.55.21-1.02.15-1.12-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Zm2.1-.5 6.9 5.2 6.9-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChatIcon({ isOpen }: { isOpen: boolean }) {
  return isOpen ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 9.5h10M7 14.5h7M5 4.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={filled ? "text-red-400" : "text-current"} aria-hidden="true">
      <path d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 5.3 5 5 0 0 1 21 8.5C21 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" /></svg>;
}

function BoltIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}
