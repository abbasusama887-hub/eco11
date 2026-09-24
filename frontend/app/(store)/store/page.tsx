import Image from "next/image";
import Link from "next/link";
import { getBrands, getCategories, getProducts } from "@/app/lib/api";
import ProductCard from "@/app/components/ProductCard";
import { STORE } from "@/app/lib/store";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Highest rated", value: "rating" },
  { label: "Most popular", value: "popular" },
] as const;

const GENDER_OPTIONS = [
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Kids", value: "kids" },
  { label: "Unisex", value: "unisex" },
] as const;

type StoreParams = Record<string, string | undefined>;

function buildQuery(current: StoreParams, overrides: StoreParams) {
  const params = new URLSearchParams();
  Object.entries({ ...current, ...overrides }).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `/store?${query}` : "/store";
}

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<StoreParams>;
}) {
  const params = await searchParams;
  const [productsResult, categoriesResult, brandsResult] = await Promise.allSettled([
    getProducts({
      search: params.search,
      category: params.category,
      brand: params.brand,
      gender: params.gender,
      min_price: params.min_price,
      max_price: params.max_price,
      size: params.size,
      rating: params.rating,
      availability: params.availability as "in_stock" | "out_of_stock" | undefined,
      ordering: (params.ordering as "price_asc" | "price_desc" | "newest" | "rating" | "popular") || "newest",
    }),
    getCategories(),
    getBrands(),
  ]);

  const products = productsResult.status === "fulfilled" ? productsResult.value.results : [];
  const productCount = productsResult.status === "fulfilled" ? productsResult.value.count : null;
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const brands = brandsResult.status === "fulfilled" ? brandsResult.value : [];
  const loadError = productsResult.status === "rejected";
  const hasFilters = Boolean(params.search || params.category || params.gender || params.brand || params.min_price || params.max_price || params.size || params.rating || params.availability);

  return (
    <main className="relative flex-1 overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.08),transparent_32%),radial-gradient(circle_at_92%_18%,rgba(37,99,235,0.06),transparent_28%)]" />
      <div className="relative mx-auto w-full max-w-[1440px] px-4 py-9 pb-28 sm:px-6 sm:pb-12 lg:px-10 lg:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-cyan-700 dark:hover:text-cyan-200">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-slate-900 dark:text-slate-200">Store</span>
        </nav>

        <header className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Image src={STORE.logo} alt={`${STORE.name} logo`} width={80} height={80} className="h-16 w-16 shrink-0 rounded-2xl object-cover sm:h-20 sm:w-20" priority />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Single-store shopping</span>
                  {STORE.verified && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Verified store</span>}
                </div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{STORE.name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{STORE.description}</p>
              </div>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Store rating</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Not yet rated</p>
            </div>
          </div>
        </header>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0" aria-labelledby="about-store-heading">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">About our store</p>
                <h2 id="about-store-heading" className="mt-2 text-xl font-bold text-slate-950 dark:text-white">Made for every step</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{STORE.sells}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">Store information</p>
                <dl className="mt-3 space-y-3 text-sm">
                  <div><dt className="font-semibold text-slate-900 dark:text-white">Delivery</dt><dd className="mt-1 text-slate-500 dark:text-slate-400">{STORE.deliveryInformation}</dd></div>
                  <div><dt className="font-semibold text-slate-900 dark:text-white">Contact</dt><dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1"><a href={`https://wa.me/92${STORE.whatsapp.slice(1)}`} target="_blank" rel="noreferrer" className="text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">WhatsApp</a><a href={`mailto:${STORE.email}`} className="text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">Email</a></dd></div>
                </dl>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">The Bazar collection</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Our products</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{productCount ?? 0} {productCount === 1 ? "product" : "products"}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {SORT_OPTIONS.map((option) => <Link key={option.value} href={buildQuery(params, { ordering: option.value })} className={`rounded-lg px-3 py-2 transition-colors ${(params.ordering ?? "newest") === option.value ? "bg-cyan-500 font-semibold text-slate-950" : "border border-slate-200 text-slate-600 hover:border-cyan-300 dark:border-white/10 dark:text-slate-300"}`}>{option.label}</Link>)}
              </div>
            </div>

            {hasFilters && <div className="mt-4 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Active filters</span>{params.search && <FilterChip label={`Search: ${params.search}`} href={buildQuery(params, { search: undefined })} />}{params.category && <FilterChip label={categories.find((category) => category.slug === params.category)?.name ?? params.category} href={buildQuery(params, { category: undefined })} />}{params.gender && <FilterChip label={params.gender} href={buildQuery(params, { gender: undefined })} />}<Link href="/store" className="text-xs font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">Clear all</Link></div>}
            {loadError && <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-400">Couldn&apos;t load products. Make sure the Django backend is running.</p>}
            {!loadError && products.length === 0 && <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center dark:border-white/15 dark:bg-white/[0.03]"><h2 className="text-lg font-semibold">No products found</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try changing your search or removing some filters.</p></div>}
            {products.length > 0 && <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 xl:gap-5">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
          </section>

          <aside className="order-first space-y-5 lg:order-last">
            <FilterPanel params={params} categories={categories} brands={brands} />
            <div className="rounded-2xl border border-slate-200 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Customer care</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">For delivery or return guidance, our existing Help Center is the place to start.</p>
              <div className="mt-4 space-y-2">{STORE.policies.map((policy) => <Link key={policy.href} href={policy.href} className="block text-sm font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">{policy.label}</Link>)}</div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function FilterChip({ label, href }: { label: string; href: string }) {
  return <Link href={href} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200">{label} <span aria-hidden="true">x</span></Link>;
}

function FilterPanel({ params, categories, brands }: { params: StoreParams; categories: { id: number; name: string; slug: string }[]; brands: { id: number; name: string; slug: string }[] }) {
  return <details open className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"><summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 dark:text-white">Filter products</summary><form action="/store" method="get" className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-white/10">
    {params.ordering && <input type="hidden" name="ordering" value={params.ordering} />}
    <input type="search" name="search" defaultValue={params.search ?? ""} placeholder="Search shoes..." aria-label="Search store products" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-white" />
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Category<select name="category" defaultValue={params.category ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label>
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Gender<select name="gender" defaultValue={params.gender ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white"><option value="">All genders</option>{GENDER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Brand<select name="brand" defaultValue={params.brand ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white"><option value="">All brands</option>{brands.map((brand) => <option key={brand.id} value={brand.slug}>{brand.name}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Min price<input name="min_price" defaultValue={params.min_price ?? ""} type="number" min="0" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Max price<input name="max_price" defaultValue={params.max_price ?? ""} type="number" min="0" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label></div>
    <div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Size<input name="size" defaultValue={params.size ?? ""} placeholder="e.g. 8" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rating<select name="rating" defaultValue={params.rating ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white"><option value="">Any</option><option value="4">4+ stars</option><option value="3">3+ stars</option></select></label></div>
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Availability<select name="availability" defaultValue={params.availability ?? ""} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white"><option value="">Any</option><option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option></select></label>
    <button type="submit" className="w-full rounded-xl bg-cyan-500 px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400">Apply filters</button>
  </form></details>;
}
