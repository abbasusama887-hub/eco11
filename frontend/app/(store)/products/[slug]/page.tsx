import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/app/lib/api";
import ProductDetailClient from "@/app/(store)/products/[slug]/ProductDetailClient";
import { SITE_URL, STORE } from "@/app/lib/store";
import type { ProductDetail } from "@/app/types/product";

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

function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
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
    try {
      const absoluteUrl = new URL(trimmed, SITE_URL).toString();
      if (!seen.has(absoluteUrl)) {
        seen.add(absoluteUrl);
        validImages.push(absoluteUrl);
      }
    } catch {
      continue;
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
  const category = product.category?.slug && product.category.name
    ? product.category
    : null;
  const categoryUrl = category
    ? new URL(`${currentSiteUrl}/shop`).toString() + `?category=${encodeURIComponent(category.slug)}`
    : null;

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
      ...(category && categoryUrl
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: category.name,
              item: categoryUrl,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 4 : 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };
}

function generateProductJsonLd(product: ProductDetail, currentSiteUrl: string) {
  const canonicalUrl = `${currentSiteUrl}/products/${encodeURIComponent(product.slug)}`;
  const description =
    cleanText(product.description) ||
    cleanText(product.short_description) ||
    cleanText(`${product.name} available at ${STORE.name}.`);
  const images = getProductImageUrls(product);
  const reviews = Array.isArray(product.reviews)
    ? product.reviews.filter(
        (review) =>
          Number.isFinite(Number(review.rating)) &&
          Number(review.rating) >= 1 &&
          Number(review.rating) <= 5 &&
          typeof review.customer_name === "string" &&
          review.customer_name.trim().length > 0,
      )
    : [];

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

  if (product.category?.name?.trim()) {
    jsonLd.category = product.category.name.trim();
  }

  if (product.sku && typeof product.sku === "string" && product.sku.trim()) {
    jsonLd.sku = product.sku.trim();
  }

  if (
    product.brand &&
    typeof product.brand === "object" &&
    typeof product.brand.name === "string" &&
    product.brand.name.trim()
  ) {
    jsonLd.brand = {
      "@type": "Brand",
      name: product.brand.name.trim(),
    };
  }

  const price = Number(product.current_price);
  if (product.current_price !== null && Number.isFinite(price)) {
    jsonLd.offers = {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "PKR",
      price: String(price),
      availability,
    };
  }

  if (reviews.length > 0) {
    jsonLd.review = reviews.map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.customer_name.trim(),
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: Number(r.rating),
      },
      ...(r.comment ? { reviewBody: cleanText(r.comment) } : {}),
      ...(r.created_at ? { datePublished: r.created_at } : {}),
    }));

    const averageRating =
      reviews.reduce((total, review) => total + Number(review.rating), 0) /
      reviews.length;
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(averageRating.toFixed(1)),
      reviewCount: reviews.length,
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
    cleanMetaDescription(product.short_description) ||
    cleanMetaDescription(`${product.name} available at ${STORE.name}.`);
  const canonicalUrl = `${SITE_URL}/products/${encodeURIComponent(product.slug)}`;
  const imageUrl = getProductImageUrl(product);

  return {
    title: {
      absolute: title,
    },
    description,
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
      description,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  const jsonLd = generateProductJsonLd(product, SITE_URL);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(product, SITE_URL);

  return (
    <>
      <section>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(breadcrumbJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(jsonLd),
          }}
        />
      </section>
      <ProductDetailClient product={product} />
    </>
  );
}
