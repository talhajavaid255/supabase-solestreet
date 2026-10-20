
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CartItemControls from "@/components/cart-item-controls";

type CartItem = {
  id: string;
  quantity: number;
  product_variants: {
    size: string;
    color: string;
    stock_quantity: number;
    products: {
      name: string;
      slug: string;
      price: number;
      is_active: boolean;
      product_images: {
        image_url: string;
        sort_order: number;
      }[];
    };
  };
};

export default async function CartPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/login");
  }

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  let items: CartItem[] = [];
  let loadError = "";

  if (cart) {
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        quantity,
        product_variants(
          size,
          color,
          stock_quantity,
          products(
            name,
            slug,
            price,
            is_active,
            product_images(image_url, sort_order)
          )
        )
      `)
      .eq("cart_id", cart.id)
      .order("created_at", { ascending: false });

    if (error) {
      loadError = error.message;
    } else {
      items = (data ?? []) as unknown as CartItem[];
    }
  }

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.product_variants.products.price) * item.quantity,
    0
  );

  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const hasUnavailableItems = items.some(
    (item) =>
      !item.product_variants.products.is_active ||
      item.quantity > item.product_variants.stock_quantity
  );

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">
      <section className="mx-auto max-w-7xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
          Your selections
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Shopping Bag
        </h1>

        <p className="mt-3 text-zinc-500">
          {totalQuantity} {totalQuantity === 1 ? "item" : "items"} in your bag
        </p>

        {loadError && (
          <div role="alert" className="mt-8 rounded-xl bg-red-50 p-5 text-red-700">
            Unable to load your cart: {loadError}
          </div>
        )}

        {!loadError && items.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-zinc-200 bg-white px-6 py-20 text-center">
            <div className="text-5xl">🛍️</div>
            <h2 className="mt-6 text-2xl font-black">
              Your bag is empty
            </h2>
            <p className="mt-3 text-zinc-500">
              Discover a pair you love and add it to your bag.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-block rounded-full bg-zinc-950 px-8 py-4 font-bold text-white hover:bg-orange-600"
            >
              Explore Shoes
            </Link>
          </div>
        ) : !loadError ? (
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              {items.map((item, index) => {
                const variant = item.product_variants;
                const product = variant.products;
                const image = [...product.product_images].sort(
                  (a, b) => a.sort_order - b.sort_order
                )[0];

                const available =
                  product.is_active &&
                  variant.stock_quantity >= item.quantity;

                return (
                  <article
                    key={item.id}
                    className="cart-row flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row"
                    style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
                  >
                    <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:w-44">
                      {image && (
                        <Image
                          src={image.image_url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 176px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between gap-5">
                      <div>
                        <Link
                          href={`/products/${product.slug}`}
                          className="text-xl font-bold hover:text-orange-600"
                        >
                          {product.name}
                        </Link>

                        <p className="mt-2 text-sm text-zinc-500">
                          Color: {variant.color} · US Size: {variant.size}
                        </p>

                        <p className="mt-3 font-bold">
                          ${Number(product.price).toFixed(2)} each
                        </p>

                        {!available && (
                          <p className="mt-2 text-sm text-red-600">
                            Quantity exceeds current stock or item is unavailable.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <CartItemControls
                          itemId={item.id}
                          quantity={item.quantity}
                          maxStock={product.is_active ? variant.stock_quantity : 0}
                        />

                        <p className="text-lg font-black">
                          ${(Number(product.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="page-enter rounded-2xl border border-zinc-200 bg-white p-7 lg:sticky lg:top-8">
              <h2 className="text-2xl font-black">Order Summary</h2>

              <div className="mt-8 flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-bold text-zinc-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <div className="mt-5 flex justify-between text-zinc-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-6">
                <div className="flex justify-between text-xl font-black">
                  <span>Estimated subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Taxes and shipping are not included.
                </p>
              </div>

              {hasUnavailableItems && (
                <p className="mt-5 text-sm text-red-600">
                  Please resolve unavailable items before checkout.
                </p>
              )}

              
{hasUnavailableItems ? (
  <p className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">
    Please fix unavailable items before continuing.
  </p>
) : (
  <Link
    href="/checkout"
    className="pressable mt-8 block w-full rounded-full bg-zinc-950 px-6 py-4 text-center font-bold text-white hover:bg-orange-600"
  >
    Proceed to Checkout →
  </Link>
)}


              <Link
                href="/products"
                className="mt-5 block text-center text-sm font-semibold text-zinc-600 hover:text-orange-600"
              >
                Continue Shopping →
              </Link>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}
