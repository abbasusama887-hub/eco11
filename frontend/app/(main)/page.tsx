import { getFeaturedProducts, getHeroSlides, type HeroSlide } from "@/app/lib/api";
import HomeClient from "@/app/components/HomeClient";
import type { Product } from "@/app/types/product";

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

  return (
    <div className="flex flex-1 flex-col bg-white">
      <HomeClient
        products={products}
        heroSlides={heroSlides}
        loadError={loadError}
      />
    </div>
  );
}
