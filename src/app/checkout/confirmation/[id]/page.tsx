
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: auth, error: authError } =
    await supabase.auth.getUser();

  if (authError || !auth.user) {
    redirect("/login");
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      currency,
      subtotal,
      shipping_amount,
      tax_amount,
      total_amount,
      shipping_method,
      created_at,
      order_items(
        id, product_name, sku, size,
        color, quantity, unit_price, line_total
      )
    `)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();

  if (error || !order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] px-6 py-16 text-zinc-900">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-2xl font-black text-zinc-950"
        >
          SOLESTREET<span className="text-orange-600">.</span>
        </Link>

        <div className="mt-12 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
            ✓
          </div>

          <p className="mt-7 text-sm font-bold uppercase tracking-widest text-orange-600">
            Demo Order Created
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Your order has been recorded.
          </h1>

          <p className="mt-4 leading-7 text-zinc-600">
            Your demo order was created successfully.
            No payment was collected, and this order
            has not been marked as paid.
          </p>

          <div className="mt-8 rounded-xl bg-zinc-50 p-5">
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Order ID
            </p>
            <p className="mt-2 break-all font-mono text-sm font-semibold">
              {order.id}
            </p>

            <p className="mt-5 text-xs uppercase tracking-widest text-zinc-500">
              Order Status
            </p>
            <p className="mt-2 font-bold capitalize">
              {order.status} — Payment not collected
            </p>

            <p className="mt-5 text-xs uppercase tracking-widest text-zinc-500">
              Delivery
            </p>
            <p className="mt-2 font-semibold capitalize">
              {order.shipping_method}
            </p>
          </div>

          <h2 className="mt-10 text-xl font-black">
            Items Ordered
          </h2>

          <div className="mt-5 divide-y divide-zinc-100">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 py-5"
              >
                <div>
                  <p className="font-bold">
                    {item.product_name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {item.color} · US {item.size}
                    · Qty {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 font-bold">
                  ${Number(item.line_total).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-zinc-200 pt-6">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>${Number(order.shipping_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Demo tax</span>
              <span>${Number(order.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-black">
              <span>Total</span>
              <span>${Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          <Link
            href="/products"
            className="mt-10 block rounded-full bg-zinc-950 px-8 py-4 text-center font-bold text-white hover:bg-orange-600"
          >
            Continue Shopping →
          </Link>
        </div>
      </div>
    </main>
  );
}
