import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/app/lib/api";
import ProductDetailClient from "@/app/(store)/products/[slug]/ProductDetailClient";
import { STORE } from "@/app/lib/store";
import type { ProductDetail } from "@/app/types/product";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteUrl =
  rawSiteUrl && rawSiteUrl.length > 0
    ? rawSiteUrl.replace(/\/+$/, "")
    : "https://eco11-dun.vercel.app";

const getCachedProduct = cache(async (slug: string): Promise<ProductDetail | null> => {
  try {
    const product = await getProductBySlug(slug);
    return product ?? null;
  } catch {
    return null;
  }
});

function cleanText(rawText?: string | null): string {
  if (!rawText) return "";
  const stripped = rawText.replace(/<[^>]*>/g, " ");
  return stripped.replace(/\s+/g, " ").trim();
}

function cleanMetaDescription(rawText?: string | null): string {
  const normalized = cleanText(rawText);
  if (normalized.length <= 160) return normalized;
  const truncated = normalized.slice(0, 160);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 120) {
    return truncated.slice(0, lastSpace).trim();
  }
  return truncated.trim();
}

function getProductImageUrls(product: ProductDetail): string[] {
  const seen = new Set<string>();
  const validImages: string[] = [];

  const candidates: (string | null | undefined)[] = [
    product.thumbnail,
    ...(product.images ? product.images.map((img) => img.image) : []),
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    if (trimmed.includes("localhost") || trimmed.includes("127.0.0.1")) continue;
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      validImages.push(trimmed);
    }
  }

  return validImages;
}

function getProductImageUrl(product: ProductDetail): string | null {
  const images = getProductImageUrls(product);
  return images.length > 0 ? images[0] : null;
}

function generateBreadcrumbJsonLd(product: ProductDetail, currentSiteUrl: string) {
  const productUrl = `${currentSiteUrl}/products/${encodeURIComponent(product.slug)}`;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${currentSiteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${currentSiteUrl}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };
}

function generateProductJsonLd(product: ProductDetail, currentSiteUrl: string) {
  const canonicalUrl = `${currentSiteUrl}/products/${encodeURIComponent(product.slug)}`;
  const description =
    cleanText(product.description) || cleanText(product.short_description);
  const images = getProductImageUrls(product);

  const isOutOfStock =
    product.is_in_stock === false || product.stock_status === "out_of_stock";
  const availability = isOutOfStock
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: canonicalUrl,
  };

  if (description) {
    jsonLd.description = description;
  }

  if (images.length > 0) {
    jsonLd.image = images.length === 1 ? images[0] : images;
  }

  if (product.sku && typeof product.sku === "string" && product.sku.trim()) {
    jsonLd.sku = product.sku.trim();
  }

  if (product.brand && typeof product.brand === "object" && product.brand.name) {
    jsonLd.brand = {
      "@type": "Brand",
      name: product.brand.name.trim(),
    };
  }

  if (
    product.current_price !== undefined &&
    product.current_price !== null &&
    !isNaN(Number(product.current_price))
  ) {
    jsonLd.offers = {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "PKR",
      price: String(product.current_price),
      availability,
    };
  }

  if (
    product.reviews &&
    Array.isArray(product.reviews) &&
    product.reviews.length > 0
  ) {
    jsonLd.review = product.reviews.map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.customer_name || "Customer",
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
      },
      ...(r.comment ? { reviewBody: cleanText(r.comment) } : {}),
      ...(r.created_at ? { datePublished: r.created_at } : {}),
    }));
  }

  if (
    product.average_rating !== null &&
    product.average_rating !== undefined &&
    typeof product.average_rating === "number" &&
    product.reviews &&
    Array.isArray(product.reviews) &&
    product.reviews.length > 0
  ) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.average_rating,
      reviewCount: product.reviews.length,
    };
  }

  return jsonLd;
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) {
    notFound();
  }

  const title = `${product.name} | ${STORE.name}`;
  const description =
    cleanMetaDescription(product.description) ||
    cleanMetaDescription(product.short_description);
  const canonicalUrl = `${siteUrl}/products/${encodeURIComponent(product.slug)}`;
  const imageUrl = getProductImageUrl(product);

  return {
    title: {
      absolute: title,
    },
    ...(description ? { description } : {}),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: STORE.name,
      title,
      url: canonicalUrl,
      ...(description ? { description } : {}),
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                alt: product.name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      ...(description ? { description } : {}),
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) {
    notFound();
  }

  const jsonLd = generateProductJsonLd(product, siteUrl);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(product, siteUrl);

  return (
    <>
      <section>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </section>
      <ProductDetailClient product={product} />
    </>
  );
}
