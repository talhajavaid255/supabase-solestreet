
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, ChevronRight, MapPin, Truck, CreditCard } from "lucide-react";
import { saveShippingAddress } from "./actions";

type CheckoutParams = {
  success?: string;
  error?: string;
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<CheckoutParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/login");
  }

  const [profileResult, addressResult, cartResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", authData.user.id)
        .maybeSingle(),
      supabase
        .from("addresses")
        .select("*")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("carts")
        .select("id")
        .eq("user_id", authData.user.id)
        .maybeSingle(),
    ]);

  if (
    profileResult.error ||
    addressResult.error ||
    cartResult.error
  ) {
    throw new Error("Unable to load checkout information.");
  }

  const { data: cart } = cartResult;

  if (!cart) {
    redirect("/cart");
  }

  const { data: cartItems, error: cartError } =
    await supabase
      .from("cart_items")
      .select("id")
      .eq("cart_id", cart.id)
      .limit(1);

  if (cartError) {
    throw new Error("Unable to verify your shopping cart.");
  }

  if (!cartItems || cartItems.length === 0) {
    redirect("/cart");
  }

  const profile = profileResult.data;
  const addresses = addressResult.data ?? [];

  const fieldClass =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100";

  const labelClass =
    "mb-2 block text-sm font-bold text-zinc-800";

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">
      <section className="page-enter mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-sm font-bold hover:text-orange-600"
        >
          <ArrowRight className="h-4 w-4 rotate-180" aria-hidden />
          Back to Bag
        </Link>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
          Secure Checkout
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Shipping Details
        </h1>

        <p className="mt-3 text-zinc-500">
          Add an address for your future deliveries.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2 font-bold text-white">
            <MapPin className="h-4 w-4" aria-hidden />
            1. Shipping
          </span>
          <ChevronRight className="h-4 w-4 text-zinc-400" aria-hidden />
          <span className="inline-flex items-center gap-2 text-zinc-400">
            <Truck className="h-4 w-4" aria-hidden />
            2. Delivery
          </span>
          <ChevronRight className="h-4 w-4 text-zinc-400" aria-hidden />
          <span className="inline-flex items-center gap-2 text-zinc-400">
            <CreditCard className="h-4 w-4" aria-hidden />
            3. Payment
          </span>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-10">

            {params.success === "1" && (
              <div
                role="status"
                className="mb-8 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800"
              >
                Shipping address saved successfully.
              </div>
            )}

            {params.error && (
              <div
                role="alert"
                className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {params.error === "validation"
                  ? "Please check the entered shipping details."
                  : "Unable to save your details. Please try again."}
              </div>
            )}

            <h2 className="text-2xl font-black">
              Add Shipping Address
            </h2>

            <form
              action={saveShippingAddress}
              className="mt-8 space-y-6"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="full_name" className={labelClass}>
                    Full Name *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    defaultValue={profile?.full_name || ""}
                    className={fieldClass}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Phone *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    minLength={7}
                    maxLength={30}
                    defaultValue={profile?.phone || ""}
                    className={fieldClass}
                    placeholder="+1 555 010 1234"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="line1" className={labelClass}>
                  Address Line 1 *
                </label>
                <input
                  id="line1"
                  name="line1"
                  required
                  minLength={3}
                  maxLength={200}
                  className={fieldClass}
                  placeholder="House number and street"
                />
              </div>

              <div>
                <label htmlFor="line2" className={labelClass}>
                  Address Line 2
                </label>
                <input
                  id="line2"
                  name="line2"
                  maxLength={200}
                  className={fieldClass}
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className={labelClass}>
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    required
                    minLength={2}
                    maxLength={100}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="state" className={labelClass}>
                    State / Province *
                  </label>
                  <input
                    id="state"
                    name="state"
                    required
                    minLength={2}
                    maxLength={100}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="postal_code" className={labelClass}>
                    Postal Code *
                  </label>
                  <input
                    id="postal_code"
                    name="postal_code"
                    required
                    minLength={2}
                    maxLength={20}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="country_code" className={labelClass}>
                    Country *
                  </label>
                  <select
                    id="country_code"
                    name="country_code"
                    required
                    defaultValue="US"
                    className={fieldClass}
                  >
                    <option value="US">United States</option>
                    <option value="PK">Pakistan</option>
                    <option value="SG">Singapore</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AE">United Arab Emirates</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-8 py-4 font-bold text-white transition hover:bg-orange-600"
              >
                Save Shipping Address
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              {addresses.length > 0 && (
  <Link
    href="/checkout/delivery"
    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-orange-700"
  >
    Continue to Delivery
    <ArrowRight className="h-4 w-4" aria-hidden />
  </Link>
)}
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-xl font-black">
                Saved Addresses
              </h2>

              {addresses.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">
                  You haven't saved any addresses yet.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm"
                    >
                      <p className="font-bold">
                        {address.full_name}
                      </p>
                      <p className="mt-2 leading-6 text-zinc-600">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                        <br />
                        {address.city}, {address.state}
                        <br />
                        {address.postal_code},{" "}
                        {address.country_code}
                      </p>
                      <p className="mt-2 text-zinc-500">
                        {address.phone}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-zinc-950 p-6 text-white">
              <h3 className="text-xl font-black">
                Checkout Progress
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Your cart is ready. We are building the
                checkout process one secure step at a time.
              </p>
              <p className="mt-5 text-xs text-zinc-400">
                No order has been placed and no payment has
                been collected.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
