import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/app/lib/api";
import { SITE_URL } from "@/app/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
    },
    {
      url: `${SITE_URL}/shop`,
    },
    {
      url: `${SITE_URL}/store`,
    },
    {
      url: `${SITE_URL}/help`,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

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
        url: `${SITE_URL}/products/${encodeURIComponent(product.slug.trim())}`,
      }));
  } catch (error) {
    console.error("Failed to fetch products for sitemap:", error);
    return staticRoutes;
  }

  try {
    const categories = await getCategories();
    const seenSlugs = new Set<string>();
    categoryRoutes = categories
      .filter((category) => {
        const slug = category?.slug?.trim();
        if (!slug || category.product_count <= 0 || seenSlugs.has(slug)) return false;
        seenSlugs.add(slug);
        return true;
      })
      .map((category) => {
        const categoryUrl = new URL(`${SITE_URL}/shop`);
        categoryUrl.searchParams.set("category", category.slug.trim());
        return { url: categoryUrl.toString() };
      });
  } catch (error) {
    console.error("Failed to fetch categories for sitemap:", error);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
