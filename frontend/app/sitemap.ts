import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/app/lib/api";
import { SITE_URL } from "@/app/lib/store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
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

  const productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];
  let productsUnavailable = false;

  try {
    const seenSlugs = new Set<string>();
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await getProducts({ page });
      const products = response?.results ?? [];

      productRoutes.push(
        ...products
          .filter((product) => {
            if (!product?.slug || typeof product.slug !== "string") return false;
            const slug = product.slug.trim();
            if (!slug || seenSlugs.has(slug)) return false;
            seenSlugs.add(slug);
            return true;
          })
          .map((product) => ({
            url: `${SITE_URL}/products/${encodeURIComponent(product.slug.trim())}`,
          })),
      );

      hasNextPage = Boolean(response?.next);
      page += 1;
    }
  } catch (error) {
    console.error("Failed to fetch products for sitemap:", error);
    productsUnavailable = true;
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
    if (!productsUnavailable) {
      console.error("Failed to fetch categories for sitemap:", error);
    }
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
