import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reconcileSession } from "@/lib/stripe/reconcile-session";
import PaymentResultStatus from "@/components/payment-result-status";
export const dynamic = "force-dynamic";
export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id: orderId } = await searchParams;
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) redirect("/account/orders");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: order, error } = await supabase.from("orders")
    .select("id,status,payment_status").eq("id", orderId).eq("user_id", user.id).maybeSingle();
  if (error || !order) redirect("/account/orders");

  let status = order.status;
  let paymentStatus = order.payment_status;
  if (status === "pending" && paymentStatus === "checkout_open") {
    try {
      await reconcileSession(order.id);
      const { data: refreshed } = await supabase.from("orders")
        .select("status,payment_status").eq("id", order.id).eq("user_id", user.id).maybeSingle();
      if (refreshed) {
        status = refreshed.status;
        paymentStatus = refreshed.payment_status;
      }
    } catch (e) {
      console.error("Payment-result reconcile failed", order.id, e);
    }
  }

  return (
    <PaymentResultStatus
      orderId={order.id}
      initial={{ status, payment_status: paymentStatus }}
    />
  );
}
