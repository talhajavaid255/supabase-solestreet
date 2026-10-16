import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  return <PaymentResultStatus orderId={order.id} initial={{ status: order.status, payment_status: order.payment_status }} />;
}
