
import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
  product: {
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
};

export default function ProductCard({
  product,
}: ProductCardProps) {
  const image = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  return (
    <article className="group product-card-shell">
      <div className="relative overflow-hidden rounded-2xl bg-[#f0eeea]">
        {product.is_featured && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-900 shadow-sm">
            Featured
          </span>
        )}

        <div className="relative aspect-square">
          {image ? (
            <Image
              src={image.image_url}
              alt={image.alt_text || product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="product-card-media object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              Image unavailable
            </div>
          )}
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 z-10"
          aria-label={`View ${product.name}`}
        />
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {product.brands?.name || "SoleStreet"}
        </p>

        <h3 className="mt-1 text-lg font-bold text-zinc-900">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center gap-3">
          <span className="font-bold text-zinc-900">
            ${Number(product.price).toFixed(2)}
          </span>

          {product.compare_at_price &&
            product.compare_at_price > product.price && (
              <span className="text-sm text-zinc-400 line-through">
                ${Number(product.compare_at_price).toFixed(2)}
              </span>
            )}
        </div>
      </div>
    </article>
  );
}
