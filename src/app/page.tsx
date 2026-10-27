
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Sparkles, Star, Truck } from "lucide-react";
import ProductCard from "@/components/product-card";
import Reveal from "@/components/reveal";

export default async function HomePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      price,
      compare_at_price,
      is_featured,
      brands(name),
      product_images(image_url, alt_text, sort_order)
    `)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Product query failed:", error.message);
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
  const featured = products.filter((p) => p.is_featured).slice(0, 3);
  const featuredIds = new Set(featured.map((p) => p.id));
  const collection = products
    .filter((p) => !featuredIds.has(p.id))
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">
      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div className="hero-copy">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">
            The new essentials
          </p>

          <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            STEP INTO
            <br />
            WHAT'S NEXT<span className="text-orange-600">.</span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-8 text-zinc-600">
            From everyday classics to performance-inspired footwear.
            Discover the pairs that move with you.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
          <Link
  href="/products"
  className="pressable inline-flex items-center gap-2 rounded-full bg-zinc-950 px-8 py-4 text-sm font-bold text-white hover:bg-orange-600"
>
  Shop Collection
  <ArrowRight className="h-4 w-4" aria-hidden />
</Link>

            <a
              href="#featured"
              className="pressable inline-flex items-center gap-2 rounded-full border border-zinc-300 px-8 py-4 text-sm font-bold text-zinc-900 hover:bg-zinc-100"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Explore Featured
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-8 border-t border-zinc-200 pt-6 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 text-orange-600" aria-hidden />
              Curated footwear
            </span>
            <span className="inline-flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-600" aria-hidden />
              Everyday comfort
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-600" aria-hidden />
              Fresh styles
            </span>
          </div>
        </div>

        <div className="hero-visual relative min-h-[380px] overflow-hidden rounded-3xl bg-[#e9e5dd] sm:min-h-[500px]">
          <Image
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&auto=format&fit=crop&q=85"
            alt="Featured sneaker editorial photograph"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />

          <div className="absolute bottom-6 left-6 rounded-full bg-white/95 px-5 py-3 text-sm font-bold text-zinc-900 shadow-lg">
            Made for your next move ↗
          </div>
        </div>
      </section>

      {/* Featured */}
      <section id="featured" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                Handpicked for you
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight">
                Featured Kicks
              </h2>
            </div>
            <a href="#collection" className="inline-flex items-center gap-1 text-sm font-bold underline underline-offset-4">
              View all products
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>

          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product, index) => (
              <Reveal key={product.id} delayMs={index * 80}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* All products */}
      <section id="collection" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                Find your style
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-tight">
                The Collection
              </h2>

              <p className="mt-3 text-zinc-500">
                Explore our latest collection of sneakers and trainers.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-sm font-bold underline underline-offset-4"
            >
              View all products
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          {error && (
            <p className="mt-6 text-red-600">
              We couldn't load the catalog. Check your Supabase connection.
            </p>
          )}

          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {collection.map((product, index) => (
              <Reveal key={product.id} delayMs={index * 80}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter-style promotional section */}
      <section className="bg-zinc-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
            SoleStreet lifestyle
          </p>
          <h2 className="mt-4 text-4xl font-black sm:text-5xl">
            YOUR STYLE. YOUR STRIDE.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-zinc-400">
            Great footwear is more than a finishing touch.
            It's where every move begins.
          </p>
          <a
            href="#collection"
            className="pressable mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-zinc-950"
          >
            Discover the Collection
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </section>

      <footer className="bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <span className="text-xl font-black text-zinc-950">
            SOLESTREET.
          </span>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} SoleStreet. Demo storefront.
          </p>
        </div>
      </footer>
    </main>
  );
}
