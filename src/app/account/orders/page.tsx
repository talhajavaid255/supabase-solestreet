
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function statusClasses(status: string) {
  switch (status) {
    case "cancelled":
      return "bg-red-50 text-red-700";
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "delivered":
      return "bg-green-50 text-green-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: auth, error: authError } =
    await supabase.auth.getUser();

  if (authError || !auth.user) {
    redirect("/login");
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      currency,
      total_amount,
      shipping_method,
      created_at,
      order_items(quantity)
    `)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load order history.");
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
          Your SoleStreet Account
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          My Orders
        </h1>

        <p className="mt-4 text-zinc-500">
          View your orders and manage eligible demo cancellations.
        </p>

        {!orders || orders.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-zinc-200 bg-white px-6 py-20 text-center">
            <div className="text-5xl">📦</div>

            <h2 className="mt-6 text-2xl font-black">
              No orders yet
            </h2>

            <p className="mt-3 text-zinc-500">
              Your order history will appear here.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-block rounded-full bg-zinc-950 px-8 py-4 font-bold text-white hover:bg-orange-600"
            >
              Explore Shoes →
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-5">
            {orders.map((order) => {
              const itemCount = order.order_items.reduce(
                (sum, item) => sum + item.quantity,
                0
              );

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Order reference
                      </p>

                      <p className="mt-2 font-mono text-sm font-semibold text-zinc-800">
                        {order.id.slice(0, 8).toUpperCase()}
                      </p>

                      <p className="mt-3 text-sm text-zinc-500">
                        {new Date(order.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${statusClasses(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-7 grid gap-5 border-y border-zinc-100 py-6 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-zinc-500">
                        Items
                      </p>
                      <p className="mt-2 font-bold">
                        {itemCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500">
                        Delivery
                      </p>
                      <p className="mt-2 font-bold capitalize">
                        {order.shipping_method}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500">
                        Order Total
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {order.currency}{" "}
                        {Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-zinc-500">
                      Demo orders do not include real payment.
                    </p>

                    <Link
                      href={`/account/orders/${order.id}`}
                      className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                    >
                      View Details →
                    </Link>
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
