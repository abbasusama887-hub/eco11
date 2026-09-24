import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl =
    rawSiteUrl && rawSiteUrl.length > 0
      ? rawSiteUrl.replace(/\/+$/, "")
      : "https://eco11-dun.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/cart",
          "/checkout",
          "/account",
          "/orders",
          "/login",
          "/signup",
          "/wishlist",
          "/compare",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
