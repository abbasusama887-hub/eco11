import type { Metadata } from "next";
import { getFeaturedProducts, getHeroSlides, type HeroSlide } from "@/app/lib/api";
import HomeClient from "@/app/components/HomeClient";
import { SITE_URL, STORE } from "@/app/lib/store";
import type { Product } from "@/app/types/product";

const homeTitle = "NDPS";
const homeDescription =
  "Shop shoes online at Bazar Store, with footwear for performance, comfort, and everyday style. Explore our collection and find your next pair.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${SITE_URL}/`,
    siteName: STORE.name,
    title: homeTitle,
    description: homeDescription,
    images: [{ url: STORE.logo, alt: `${STORE.name} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: [STORE.logo],
  },
};

export default async function Home() {
  let products: Product[] = [];
  let heroSlides: HeroSlide[] = [];
  let loadError: string | null = null;

  // Both fetches run in parallel
  await Promise.allSettled([
    getFeaturedProducts(8).then((d) => { products = d.results; }),
    getHeroSlides().then((s) => { heroSlides = s; }),
  ]).then((results) => {
    const err = results.find((r) => r.status === "rejected");
    if (err && err.status === "rejected") {
      loadError = err.reason instanceof Error
        ? err.reason.message
        : "Could not load data.";
    }
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: STORE.name,
        url: `${SITE_URL}/`,
        logo: new URL(STORE.logo, SITE_URL).toString(),
        email: STORE.email,
        telephone: "+923047345026",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: STORE.name,
        url: `${SITE_URL}/`,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/shop?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <div className="flex flex-1 flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <HomeClient
        products={products}
        heroSlides={heroSlides}
        loadError={loadError}
      />
    </div>
  );
}
