
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/cart/actions";

type Variant = {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
};

type ProductImage = {
  image_url: string;
  alt_text: string | null;
  sort_order: number;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  product_images: ProductImage[];
  product_variants: Variant[];
};

export default function ProductDetails({
  product,
}: {
  product: Product;
}) {
  const images = useMemo(
    () =>
      [...product.product_images].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    [product.product_images]
  );

  const colors = useMemo(
    () => [...new Set(product.product_variants.map((v) => v.color))],
    [product.product_variants]
  );

  const [selectedColor, setSelectedColor] = useState(
    colors[0] ?? ""
  );

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const router = useRouter();
const [adding, setAdding] = useState(false);
const [cartError, setCartError] = useState("");

  const variantsForColor = useMemo(
    () =>
      product.product_variants
        .filter((v) => v.color === selectedColor)
        .sort((a, b) => Number(a.size) - Number(b.size)),
    [product.product_variants, selectedColor]
  );

  const selectedVariant = variantsForColor.find(
    (v) => v.size === selectedSize
  );

  const availableStock = selectedVariant?.stock_quantity ?? 0;

  const hasStock = variantsForColor.some(
    (v) => v.stock_quantity > 0
  );

  function selectColor(color: string) {
    setSelectedColor(color);
    setSelectedSize("");
    setQuantity(1);
  }

  function selectSize(size: string) {
    setSelectedSize(size);
    setQuantity(1);
  }

  function increaseQuantity() {
    setQuantity((current) =>
      Math.min(current + 1, availableStock)
    );
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  const mainImage = images[activeImage];

  
async function handleAddToCart() {
    if (!selectedVariant || adding || quantity < 1) return;
  
    setAdding(true);
    setCartError("");
  
    try {
      const result = await addToCart(selectedVariant.id, quantity);
  
      if (result.success) {
        router.push("/cart");
        return;
      }
  
      if (result.error === "Please sign in to continue.") {
        router.push("/login");
        return;
      }
  
      setCartError(result.error || "Unable to add item.");
    } catch {
      setCartError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-2">
      {/* Product gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-zinc-100">
          {mainImage ? (
            <Image
              src={mainImage.image_url}
              alt={mainImage.alt_text || product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              Product image unavailable
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {images.map((image, index) => (
              <button
                key={`${image.image_url}-${index}`}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`View product image ${index + 1}`}
                aria-pressed={activeImage === index}
                className={`relative h-24 w-24 overflow-hidden rounded-xl border-2 ${
                  activeImage === index
                    ? "border-zinc-950"
                    : "border-transparent"
                }`}
              >
                <Image
                  src={image.image_url}
                  alt={image.alt_text || product.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product information */}
      <div className="py-4 text-zinc-900">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
          SoleStreet Collection
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight lg:text-5xl">
          {product.name}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="text-3xl font-bold">
            ${Number(product.price).toFixed(2)}
          </span>

          {product.compare_at_price &&
            product.compare_at_price > product.price && (
              <span className="text-lg text-zinc-400 line-through">
                ${Number(product.compare_at_price).toFixed(2)}
              </span>
            )}
        </div>

        <p className="mt-8 leading-8 text-zinc-600">
          {product.description}
        </p>

        {/* Colors */}
        {colors.length > 0 && (
          <div className="mt-9">
            <h2 className="font-bold">Color: {selectedColor}</h2>

            <div className="mt-4 flex flex-wrap gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => selectColor(color)}
                  aria-pressed={selectedColor === color}
                  className={`rounded-xl border px-5 py-3 text-sm font-bold transition ${
                    selectedColor === color
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-950"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sizes */}
        <div className="mt-9">
          <h2 className="font-bold">Select Size (US)</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            {variantsForColor.map((variant) => {
              const outOfStock = variant.stock_quantity === 0;
              const selected = variant.size === selectedSize;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => selectSize(variant.size)}
                  aria-pressed={selected}
                  className={`min-w-16 rounded-xl border px-5 py-3 text-sm font-bold transition ${
                    selected
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : outOfStock
                      ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 line-through"
                      : "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-950"
                  }`}
                >
                  {variant.size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stock status */}
        <div className="mt-6" aria-live="polite">
          {!hasStock ? (
            <p className="font-medium text-red-600">
              Currently out of stock
            </p>
          ) : !selectedVariant ? (
            <p className="text-sm text-zinc-500">
              Select a size to check availability.
            </p>
          ) : (
            <p className="font-medium text-green-700">
              In stock — {availableStock} available
            </p>
          )}
        </div>

        {/* Quantity */}
        <div className="mt-9">
          <h2 className="font-bold">Quantity</h2>

          <div className="mt-4 inline-flex items-center overflow-hidden rounded-xl border border-zinc-300 bg-white">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={!selectedVariant || quantity <= 1}
              className="px-5 py-3 text-xl disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span className="min-w-10 text-center font-bold">
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={!selectedVariant || quantity >= availableStock}
              className="px-5 py-3 text-xl disabled:opacity-30"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        {/* Cart integration follows in the next stage */}
        
<div className="mt-10">
  <button
    type="button"
    onClick={handleAddToCart}
    disabled={!selectedVariant || availableStock < 1 || adding}
    className="w-full rounded-full bg-zinc-950 px-8 py-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {adding ? "Adding to cart..." : "Add to Cart →"}
  </button>

  {cartError && (
    <p role="alert" className="mt-3 text-sm text-red-600">
      {cartError}
    </p>
  )}

  <p className="mt-4 text-center text-xs text-zinc-500">
    Select a size before adding this product.
  </p>
</div>


        <p className="mt-4 text-center text-xs text-zinc-500">
          Your selection is ready. Cart functionality is the next milestone.
        </p>
      </div>
    </section>
  );
}
