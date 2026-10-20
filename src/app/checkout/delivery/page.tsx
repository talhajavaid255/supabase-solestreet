import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutDelivery from "@/components/checkout-delivery";

export default async function DeliveryPage() {
  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    redirect("/login");
  }

  const { data: addresses, error: addressError } = await supabase
    .from("addresses")
    .select(
      `
        id, full_name, line1, line2, city,
        state, postal_code, country_code, is_default
      `,
    )
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (addressError) {
    throw new Error("Unable to load shipping addresses.");
  }

  if (!addresses || addresses.length === 0) {
    redirect("/checkout");
  }

  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (cartError) {
    throw new Error("Unable to load shopping cart.");
  }

  if (!cart) {
    redirect("/cart");
  }

  const { data: items, error: itemsError } = await supabase
    .from("cart_items")
    .select(
      `
      quantity,
      product_variants(
        stock_quantity,
        products(price, is_active)
      )
    `,
    )
    .eq("cart_id", cart.id);

  if (itemsError) {
    throw new Error("Unable to load cart items.");
  }

  if (!items || items.length === 0) {
    redirect("/cart");
  }

  const subtotal = items.reduce((sum, item) => {
      //@ts-ignore
    const product = item.product_variants.products;
    return sum + Number(product.price) * item.quantity;
  }, 0);

  const hasUnavailableItems = items.some(
    (item) =>
      //@ts-ignore
      !item.product_variants.products.is_active ||
      //@ts-ignore
      
      item.quantity > item.product_variants.stock_quantity,
  );

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/cart"
          className="text-sm font-bold hover:text-orange-600"
        >
          ← Back to Bag
        </Link>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
          SoleStreet Checkout
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Delivery & Order Review
        </h1>

        <p className="mt-3 mb-10 text-zinc-500">
          Select your delivery details before placing a demo order.
        </p>

        {hasUnavailableItems ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
            <h2 className="text-xl font-bold text-red-800">
              Your cart needs attention
            </h2>
            <p className="mt-3 text-red-700">
              One or more items are unavailable or exceed current stock.
            </p>
            <Link
              href="/cart"
              className="mt-6 inline-block rounded-full bg-zinc-950 px-6 py-3 font-bold text-white"
            >
              Review Cart
            </Link>
          </div>
        ) : (
          <CheckoutDelivery addresses={addresses} subtotal={subtotal} />
        )}
      </section>
    </main>
  );
}
