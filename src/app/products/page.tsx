
import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/product-card";
import ProductsPagination from "@/components/products-pagination";
import Reveal from "@/components/reveal";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 9;

type SearchParams = {
  q?: string;
  brand?: string;
  category?: string;
  sort?: string;
  page?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const search = (params.q ?? "").trim().slice(0, 100);
  const brand = params.brand ?? "";
  const category = params.category ?? "";
  const sort = params.sort ?? "newest";
  const requestedPage = Math.max(
    1,
    Number.parseInt(params.page ?? "1", 10) || 1,
  );

  // Load filter options
  const [brandsResult, categoriesResult] = await Promise.all([
    supabase.from("brands").select("id,name,slug").order("name"),
    supabase.from("categories").select("id,name,slug").order("name"),
  ]);

  const brands = brandsResult.data ?? [];
  const categories = categoriesResult.data ?? [];

  const selectedBrand = brands.find((b) => b.slug === brand);
  const selectedCategory = categories.find((c) => c.slug === category);

  // Query product catalog
  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      price,
      compare_at_price,
      is_featured,
      brands(name),
      product_images(image_url, alt_text, sort_order)
    `,
      { count: "exact" },
    )
    .eq("is_active", true);

  // Apply PostgreSQL filters
  if (search) {
    // Escape SQL LIKE wildcard characters
    const safeSearch = search.replace(/[\\%_]/g, "\\$&");
    query = query.ilike("name", `%${safeSearch}%`);
  }

  if (brand) {
    query = selectedBrand
      ? query.eq("brand_id", selectedBrand.id)
      : query.eq("brand_id", "00000000-0000-0000-0000-000000000000");
  }

  if (category) {
    query = selectedCategory
      ? query.eq("category_id", selectedCategory.id)
      : query.eq("category_id", "00000000-0000-0000-0000-000000000000");
  }

  // Sorting
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (requestedPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let { data, error, count } = await query.range(from, to);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  if (page !== requestedPage && total > 0) {
    const retryFrom = (page - 1) * PAGE_SIZE;
    const retry = await query.range(retryFrom, retryFrom + PAGE_SIZE - 1);
    data = retry.data;
    error = retry.error;
  }

  type Product = {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    is_featured: boolean;
    brands: { name: string } | null;
    product_images: {
      image_url: string;
      alt_text: string | null;
      sort_order: number;
    }[];
  };

  const products = (data ?? []) as unknown as Product[];

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">
      {/* Page Heading */}
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-12">
        <div className="text-sm text-zinc-500">
          <Link href="/" className="hover:text-orange-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-zinc-900">Shop</span>
        </div>

        <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
          The SoleStreet collection
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Find Your Perfect Pair.
        </h1>

        <p className="mt-4 max-w-xl text-zinc-500">
          Explore our selection of lifestyle sneakers, running shoes,
          and everyday essentials.
        </p>
      </section>

      {/* Catalog */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-10 lg:grid-cols-[250px_1fr]">

          {/* Filters */}
          <aside className="self-start rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-xl font-black">
                <SlidersHorizontal className="h-5 w-5" aria-hidden />
                Filters
              </h2>

              <Link
                href="/products"
                className="text-xs font-bold text-orange-600 hover:underline"
              >
                Reset
              </Link>
            </div>

            <form method="GET" action="/products" className="space-y-7">
              <div>
                <label
                  htmlFor="search"
                  className="mb-3 block text-sm font-bold"
                >
                  Search
                </label>

                <input
                  id="search"
                  type="search"
                  name="q"
                  defaultValue={search}
                  placeholder="Search sneakers..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label
                  htmlFor="brand"
                  className="mb-3 block text-sm font-bold"
                >
                  Brand
                </label>

                <select
                  id="brand"
                  name="brand"
                  defaultValue={brand}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900"
                >
                  <option value="">All brands</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-3 block text-sm font-bold"
                >
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  defaultValue={category}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="sort"
                  className="mb-3 block text-sm font-bold"
                >
                  Sort by
                </label>

                <select
                  id="sort"
                  name="sort"
                  defaultValue={sort}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900"
                >
                  <option value="newest">Newest first</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>

              <button
                type="submit"
                className="pressable inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-4 text-sm font-bold text-white hover:bg-orange-600"
              >
                Apply Filters
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </aside>

          {/* Product Results */}
          <div>
            <div className="mb-7 flex items-center justify-between border-b border-zinc-200 pb-5">
              <p className="text-sm text-zinc-500">
                Showing{" "}
                <span className="font-bold text-zinc-900">
                  {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, total)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-zinc-900">{total}</span>{" "}
                products
              </p>

              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                SoleStreet Collection
              </span>
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                Unable to load products: {error.message}
              </div>
            )}

            {!error && products.length === 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-20 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                  <Search className="h-7 w-7" aria-hidden />
                </div>
                <h2 className="text-2xl font-black">
                  No shoes found
                </h2>
                <p className="mt-3 text-zinc-500">
                  Try a different search or reset your filters.
                </p>
                <Link
                  href="/products"
                  className="mt-6 inline-block rounded-full bg-black px-7 py-3 font-bold text-white"
                >
                  View All Products
                </Link>
              </div>
            )}

            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <Reveal key={product.id} delayMs={(index % 6) * 50}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>

            <ProductsPagination
              page={page}
              totalPages={totalPages}
              filters={{ q: search, brand, category, sort }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
