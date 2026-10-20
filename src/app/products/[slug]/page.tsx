
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
      <ProductDetails product={product} />
    </main>
  );
}
