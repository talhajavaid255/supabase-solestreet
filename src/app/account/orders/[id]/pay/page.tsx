import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PayOrderPage({params}: {params:Promise<{id:string}>}) {
  const {id} = await params;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:order}=await supabase.from("orders")
    .select("id,status,payment_status,total_amount,currency,stripe_checkout_session_id")
    .eq("id",id).eq("user_id",user.id).maybeSingle();
  if(!order) notFound();
  const eligible=order.status==="pending" && order.payment_status==="unpaid" && !order.stripe_checkout_session_id;
  return <main className="min-h-screen bg-[#faf9f6] p-8 text-zinc-900">
    <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-8">
      <Link href={`/account/orders/${id}`} className="text-sm font-semibold text-orange-600">← Order details</Link>
      <h1 className="mt-7 text-3xl font-black">Secure test payment</h1>
      <p className="mt-3 text-zinc-600">Order {id.slice(0,8).toUpperCase()}</p>
      <p className="mt-5 text-2xl font-black">{order.currency} {Number(order.total_amount).toFixed(2)}</p>
      <p className="mt-3 text-sm text-zinc-500">Only Stripe test cards are supported. No real money will be charged.</p>
      {eligible ? <form action="/api/stripe/checkout" method="POST" className="mt-8">
        <input type="hidden" name="orderId" value={id}/>
        <button className="w-full rounded-full bg-zinc-950 px-6 py-4 font-bold text-white hover:bg-orange-600">Pay securely with Stripe →</button>
      </form> : <p className="mt-7 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">This order is no longer eligible for a new payment session. Status: {order.status} / {order.payment_status}. If checkout is open, finish the Stripe session or wait for its expiration.</p>}
    </div>
  </main>;
}
