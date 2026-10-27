import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CancelOrderButton from "@/components/cancel-order-button";
import { ArrowRight, CreditCard } from "lucide-react";
import ReconcilePaymentButton from "@/components/reconcile-payment-button";

type ShippingAddress = {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code?: string;
};

function getStatusStyles(status: string) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

function formatCurrency(value: number | string) {
  return `$${Number(value).toFixed(2)}`;
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Verify authenticated user
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    redirect("/login");
  }

  // 2. Fetch customer's order from Supabase
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      user_id,
      status,
      payment_status,
      payment_reference,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      paid_at,
      currency,
      shipping_method,
      shipping_address,
      subtotal,
      shipping_amount,
      tax_amount,
      total_amount,
      created_at,
      order_items(
        id,
        product_name,
        sku,
        size,
        color,
        quantity,
        unit_price,
        line_total
      )
    `,
    )
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    console.error("Order details error:", error.message);
    throw new Error("Unable to load order details.");
  }

  if (!order) {
    notFound();
  }

  const address = (order.shipping_address ?? {}) as ShippingAddress;

  // 3. Determine available order actions

  const hasStripeSession = Boolean(order.stripe_checkout_session_id);

  const isUnpaid = order.payment_status === "unpaid";

  const isPending = order.status === "pending";

  // Existing demo cancellation is allowed only
  // when no Stripe payment session is attached.
  const canCancel =
    isPending &&
    isUnpaid &&
    order.payment_reference === null &&
    !hasStripeSession;

  // Stripe payment can start only for eligible orders.
  const canPayWithStripe = isPending && isUnpaid && !hasStripeSession;

  const isPaid = order.payment_status === "paid" || order.status === "paid";

  const isAwaitingPayment = isPending && hasStripeSession && !isPaid;

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">
      {/* Main content */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
          SoleStreet Orders
        </p>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <span
            className={`rounded-full px-5 py-2 text-sm font-bold capitalize ${getStatusStyles(order.status)}`}
          >
            {order.status}
          </span>
        </div>

        {/* Payment status banner */}
        <div
          className={`mt-8 rounded-2xl border p-5 ${
            isPaid
              ? "border-green-200 bg-green-50"
              : isAwaitingPayment
                ? "border-blue-200 bg-blue-50"
                : order.status === "cancelled"
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
          }`}
        >
          {isPaid ? (
            <>
              <p className="font-bold text-green-800">Payment Successful</p>
              <p className="mt-2 text-sm text-green-700">
                Stripe payment has been confirmed and your order has been marked
                as paid.
              </p>
            </>
          ) : isAwaitingPayment ? (
            <>
              <p className="font-bold text-blue-800">Stripe Checkout Started</p>
              <p className="mt-2 text-sm text-blue-700">
                A Stripe Checkout Session is associated with this order. Payment
                confirmation is still pending.
              </p>
            </>
          ) : order.status === "cancelled" ? (
            <>
              <p className="font-bold text-red-800">Order Cancelled</p>
              <p className="mt-2 text-sm text-red-700">
                This order has been cancelled. No payment is required.
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-amber-800">Payment Pending</p>
              <p className="mt-2 text-sm text-amber-700">
                Your order has been created, but no payment has been confirmed.
              </p>
            </>
          )}
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          {/* Left content */}
          <div className="space-y-7">
            {/* Ordered Items */}
            <section className="rounded-3xl border border-zinc-200 bg-white p-7 sm:p-9">
              <h2 className="text-2xl font-black">Ordered Items</h2>

              <div className="mt-6 divide-y divide-zinc-100">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap justify-between gap-5 py-5"
                  >
                    <div>
                      <h3 className="font-bold text-zinc-950">
                        {item.product_name}
                      </h3>

                      <p className="mt-2 text-sm text-zinc-500">
                        {item.color} · US {item.size}· Qty {item.quantity}
                      </p>

                      <p className="mt-1 font-mono text-xs text-zinc-400">
                        SKU: {item.sku}
                      </p>

                      <p className="mt-3 text-sm text-zinc-500">
                        Unit price: {formatCurrency(item.unit_price)}
                      </p>
                    </div>

                    <p className="font-black text-zinc-950">
                      {formatCurrency(item.line_total)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Shipping Information */}
            <section className="rounded-3xl border border-zinc-200 bg-white p-7 sm:p-9">
              <h2 className="text-2xl font-black">Shipping Information</h2>

              <div className="mt-6 text-sm leading-7 text-zinc-600">
                <p className="font-bold text-zinc-900">
                  {address.full_name ?? "Customer"}
                </p>

                <p>{address.line1}</p>

                {address.line2 && <p>{address.line2}</p>}

                <p>
                  {address.city}, {address.state} {address.postal_code}
                </p>

                <p>{address.country_code}</p>
                <p>{address.phone}</p>
              </div>

              <div className="mt-6 border-t border-zinc-100 pt-5">
                <p className="text-sm text-zinc-500">Delivery Method</p>

                <p className="mt-2 font-bold capitalize">
                  {order.shipping_method}
                </p>
              </div>
            </section>

            {/* Payment Information */}
            <section className="rounded-3xl border border-zinc-200 bg-white p-7 sm:p-9">
              <h2 className="text-2xl font-black">Payment Information</h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-zinc-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Payment Method
                  </p>

                  <p className="mt-3 font-semibold">
                    {hasStripeSession ? "Stripe Checkout" : "Not selected"}
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Payment Status
                  </p>

                  <p className="mt-3 font-semibold capitalize">
                    {order.payment_status}
                  </p>
                </div>
              </div>

              {order.paid_at && (
                <p className="mt-6 text-sm text-zinc-500">
                  Paid on {new Date(order.paid_at).toLocaleString("en-US")}
                </p>
              )}

              <p className="mt-6 text-xs leading-6 text-zinc-500">
                This SoleStreet integration currently uses Stripe test mode. No
                real payments are collected.
              </p>
            </section>

            {/* Order Actions */}
            <section className="rounded-3xl border border-zinc-200 bg-white p-7 sm:p-9">
              <h2 className="text-xl font-black">Order Actions</h2>

              {canPayWithStripe && (
                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-5">
                  <p className="font-bold text-zinc-950">
                    Complete Your Payment
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Continue to Stripe's secure hosted checkout to complete your
                    test payment.
                  </p>

                  <Link
                    href={`/account/orders/${order.id}/pay`}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-7 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                  >
                    <CreditCard className="h-4 w-4" aria-hidden />
                    Pay with Stripe
                  </Link>
                </div>
              )}

              {isAwaitingPayment && (
                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <p className="font-bold text-blue-800">
                    Payment verification pending
                  </p>

                  <p className="mt-2 text-sm text-blue-700">
                    If you have completed Stripe Checkout, verify the payment
                    status securely.
                  </p>

                  <ReconcilePaymentButton orderId={order.id} />
                </div>
              )}
              {canCancel && (
                <div className="mt-7 border-t border-zinc-100 pt-7">
                  <p className="mb-5 text-sm leading-6 text-zinc-500">
                    You can cancel this unpaid demo order. Its reserved test
                    inventory will be restored.
                  </p>

                  <CancelOrderButton orderId={order.id} />
                </div>
              )}

              {!canPayWithStripe && !canCancel && !isAwaitingPayment && (
                <p className="mt-5 text-sm text-zinc-500">
                  {order.status === "cancelled"
                    ? "This order has been cancelled."
                    : isPaid
                      ? "Payment completed. No further payment action is required."
                      : "No actions are currently available for this order."}
                </p>
              )}
            </section>
          </div>

          {/* Order Summary */}
          <aside className="rounded-3xl border border-zinc-200 bg-white p-7 lg:sticky lg:top-8">
            <h2 className="text-2xl font-black">Order Summary</h2>

            <div className="mt-8 space-y-5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Subtotal</span>
                <span className="font-semibold">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-600">Shipping</span>
                <span className="font-semibold">
                  {formatCurrency(order.shipping_amount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-600">Demo Tax</span>
                <span className="font-semibold">
                  {formatCurrency(order.tax_amount)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-between border-t border-zinc-200 pt-6 text-xl font-black">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>

            <div className="mt-8 rounded-xl bg-zinc-50 p-5">
              <p className="text-sm font-bold text-zinc-900">Payment Summary</p>

              <p className="mt-2 text-sm text-zinc-600">
                Status:{" "}
                <span className="font-semibold capitalize">
                  {order.payment_status}
                </span>
              </p>

              <p className="mt-2 text-xs leading-6 text-zinc-500">
                All Stripe transactions are performed in test mode.
              </p>
            </div>

            <Link
              href="/account/orders"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 px-6 py-4 text-center text-sm font-bold text-zinc-900 transition hover:bg-zinc-100"
            >
              <ArrowRight className="h-4 w-4 rotate-180" aria-hidden />
              Back to My Orders
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
