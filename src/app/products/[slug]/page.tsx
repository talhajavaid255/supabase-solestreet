
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductDetails from "@/components/product-details";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      compare_at_price,
      product_images(image_url, alt_text, sort_order),
      product_variants(id, size, color, stock_quantity)
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-zinc-950"
          >
            SOLESTREET<span className="text-orange-600">.</span>
          </Link>

          <Link
            href="/products"
            className="text-sm font-semibold text-zinc-700 hover:text-orange-600"
          >
            ← Back to Shop
          </Link>
        </div>
      </header>

      <ProductDetails product={product} />
    </main>
  );
}
