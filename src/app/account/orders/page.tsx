import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function statusClasses(status: string) {
  switch (status) {
    case "paid":
    case "delivered":
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-1 ring-red-100";
    case "pending":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-100";
    case "processing":
      return "bg-sky-50 text-sky-800 ring-1 ring-sky-100";
    case "shipped":
      return "bg-violet-50 text-violet-800 ring-1 ring-violet-100";
    default:
      return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200";
  }
}

function accentClass(status: string) {
  switch (status) {
    case "paid":
    case "delivered":
      return "bg-emerald-500";
    case "cancelled":
      return "bg-red-500";
    case "pending":
      return "bg-amber-500";
    default:
      return "bg-orange-500";
  }
}

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    redirect("/login");
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      payment_status,
      currency,
      total_amount,
      shipping_method,
      created_at,
      order_items(quantity, product_name, size, color)
    `,
    )
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load order history.");
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">
      <section className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
          Your SoleStreet Account
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          My Orders
        </h1>

        <p className="mt-4 max-w-xl text-zinc-500">
          Track purchases, payment status, and eligible cancellations.
        </p>

        {!orders || orders.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-zinc-200 bg-white px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
              <Package className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="mt-6 text-2xl font-black">No orders yet</h2>
            <p className="mt-3 text-zinc-500">
              Your order history will appear here.
            </p>
            <Link
              href="/products"
              className="pressable mt-8 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-8 py-4 font-bold text-white hover:bg-orange-600"
            >
              Explore Shoes
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {orders.map((order) => {
              const itemCount = order.order_items.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );
              const displayStatus =
                order.payment_status === "paid" && order.status === "pending"
                  ? "paid"
                  : order.status;
              const preview = order.order_items.slice(0, 3);
              const extraItems = order.order_items.length - preview.length;

              return (
                <article
                  key={order.id}
                  className="product-card-shell relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
                >
                  <div
                    className={`absolute inset-y-0 left-0 w-1.5 ${accentClass(displayStatus)}`}
                    aria-hidden
                  />

                  <div className="p-5 pl-7 sm:p-6 sm:pl-8">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                          Order {order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${statusClasses(displayStatus)}`}
                      >
                        {displayStatus}
                      </span>
                    </div>

                    <ul className="mt-5 space-y-2">
                      {preview.map((item, index) => (
                        <li
                          key={`${item.product_name}-${index}`}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="min-w-0 truncate font-semibold text-zinc-900">
                            {item.product_name}
                            <span className="ml-2 font-medium text-zinc-400">
                              {item.color} · US {item.size}
                            </span>
                          </span>
                          <span className="shrink-0 tabular-nums text-zinc-500">
                            ×{item.quantity}
                          </span>
                        </li>
                      ))}
                      {extraItems > 0 ? (
                        <li className="text-xs font-semibold text-orange-600">
                          +{extraItems} more{" "}
                          {extraItems === 1 ? "item" : "items"}
                        </li>
                      ) : null}
                    </ul>

                    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-zinc-100 pt-5">
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <p>
                          <span className="text-zinc-400">Items</span>{" "}
                          <span className="font-bold text-zinc-900">{itemCount}</span>
                        </p>
                        <p>
                          <span className="text-zinc-400">Delivery</span>{" "}
                          <span className="font-bold capitalize text-zinc-900">
                            {order.shipping_method}
                          </span>
                        </p>
                        <p>
                          <span className="text-zinc-400">Total</span>{" "}
                          <span className="text-lg font-black text-zinc-950">
                            ${Number(order.total_amount).toFixed(2)}
                          </span>
                        </p>
                      </div>

                      <Link
                        href={`/account/orders/${order.id}`}
                        className="pressable inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
                      >
                        View details
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
