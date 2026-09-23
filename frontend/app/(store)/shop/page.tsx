import Link from "next/link";
import { getCategories, getProducts } from "@/app/lib/api";
import ProductCard from "@/app/components/ProductCard";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
];

const GENDER_OPTIONS = [
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Kids", value: "kids" },
  { label: "Unisex", value: "unisex" },
];

function buildQuery(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };
  Object.entries(merged).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const [productsResult, categoriesResult] = await Promise.allSettled([
    getProducts({
      search: params.search,
      category: params.category,
      gender: params.gender,
      ordering: (params.ordering as "price_asc" | "price_desc" | "newest") || "newest",
    }),
    getCategories(),
  ]);

  const products = productsResult.status === "fulfilled" ? productsResult.value.results : [];
  const loadError = productsResult.status === "rejected" ? String(productsResult.reason) : null;
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];

  return (
    <main className="relative flex-1 overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.08),transparent_32%),radial-gradient(circle_at_92%_18%,rgba(37,99,235,0.06),transparent_28%)]" />
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-9 sm:px-6 lg:px-10 lg:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="transition-colors hover:text-cyan-700 dark:hover:text-cyan-200">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-slate-900 dark:text-slate-200">Shop</span>
        </nav>

        <header className="mb-9 flex flex-col gap-5 border-b border-slate-200 pb-8 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">The collection</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {params.category
                ? categories.find((c) => c.slug === params.category)?.name ?? "Shop"
                : "All Shoes"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Explore premium footwear for performance, comfort, and everyday style.
            </p>
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {products.length} {products.length === 1 ? "product" : "products"}
          </div>
        </header>

        <div className="mb-8 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] lg:sticky lg:top-24">
          <form action="/shop" method="get" className="mb-6">
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.gender && <input type="hidden" name="gender" value={params.gender} />}
            {params.ordering && <input type="hidden" name="ordering" value={params.ordering} />}
            <input
              type="search"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Search shoes..."
              aria-label="Search shoes"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-slate-500"
            />
          </form>

          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Category
            </h2>
            <ul className="mt-3 space-y-1.5">
              <li>
                <Link
                  href={buildQuery(params, { category: undefined })}
                    className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                    !params.category
                        ? "bg-cyan-500 font-semibold text-slate-950"
                        : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-400 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-200"
                  }`}
                >
                  All
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={buildQuery(params, { category: cat.slug })}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                      params.category === cat.slug
                        ? "bg-cyan-500 font-semibold text-slate-950"
                        : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-400 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-200"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs opacity-70">{cat.product_count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7 border-t border-slate-200 pt-6 dark:border-white/10">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Gender
            </h2>
            <ul className="mt-3 space-y-1.5">
              <li>
                <Link
                  href={buildQuery(params, { gender: undefined })}
                    className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                    !params.gender
                        ? "bg-cyan-500 font-semibold text-slate-950"
                        : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-400 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-200"
                  }`}
                >
                  All
                </Link>
              </li>
              {GENDER_OPTIONS.map((opt) => (
                <li key={opt.value}>
                  <Link
                    href={buildQuery(params, { gender: opt.value })}
                    className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                      params.gender === opt.value
                        ? "bg-cyan-500 font-semibold text-slate-950"
                        : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-400 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-200"
                    }`}
                  >
                    {opt.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              {products.length} {products.length === 1 ? "product" : "products"}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="sort-links" className="text-slate-500 dark:text-slate-400">Sort by</label>
              <div id="sort-links" className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.05]">
              {SORT_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  href={buildQuery(params, { ordering: opt.value })}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    (params.ordering ?? "newest") === opt.value
                      ? "bg-cyan-500 font-semibold text-slate-950"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
              </div>
            </div>
          </div>

          {(params.search || params.category || params.gender) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Active filters</span>
              {params.search && <FilterChip label={`Search: ${params.search}`} href={buildQuery(params, { search: undefined })} />}
              {params.category && <FilterChip label={categories.find((c) => c.slug === params.category)?.name ?? params.category} href={buildQuery(params, { category: undefined })} />}
              {params.gender && <FilterChip label={params.gender} href={buildQuery(params, { gender: undefined })} />}
              <Link href="/shop" className="text-xs font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">Clear all</Link>
            </div>
          )}

          {loadError && (
            <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-400">
              Couldn&apos;t load products. Make sure the Django backend is running.
            </p>
          )}

          {!loadError && products.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center dark:border-white/15 dark:bg-white/[0.03]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-300/10 dark:text-cyan-300">⌕</div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No products found</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try changing your search or removing some filters.</p>
              <Link href="/shop" className="mt-5 inline-flex rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500">Browse all products</Link>
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 xl:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </main>
  );
}

function FilterChip({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800 transition-colors hover:border-cyan-400 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200">
      {label}<span aria-hidden="true">×</span>
    </Link>
  );
}
