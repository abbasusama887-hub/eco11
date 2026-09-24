import type { MetadataRoute } from "next";
import { getProducts } from "@/app/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl =
    rawSiteUrl && rawSiteUrl.length > 0
      ? rawSiteUrl.replace(/\/+$/, "")
      : "https://eco11-dun.vercel.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
    },
    {
      url: `${siteUrl}/shop`,
    },
    {
      url: `${siteUrl}/store`,
    },
    {
      url: `${siteUrl}/help`,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const response = await getProducts();
    const products = response?.results ?? [];

    const seenSlugs = new Set<string>();

    productRoutes = products
      .filter((product) => {
        if (!product?.slug || typeof product.slug !== "string") return false;
        const slug = product.slug.trim();
        if (!slug || seenSlugs.has(slug)) return false;
        seenSlugs.add(slug);
        return true;
      })
      .map((product) => ({
        url: `${siteUrl}/products/${encodeURIComponent(product.slug.trim())}`,
      }));
  } catch (error) {
    // If backend is unreachable or building offline, do not crash sitemap generation
    console.error("Failed to fetch products for sitemap:", error);
  }

  return [...staticRoutes, ...productRoutes];
}
