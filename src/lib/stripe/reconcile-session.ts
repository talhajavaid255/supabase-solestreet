import { adminSupabase } from "@/lib/stripe/admin";
import { stripe } from "@/lib/stripe/server";

/** Call ONLY from trusted server code. Does not create charges or sessions. */
export async function reconcileSession(orderId: string) {
  const admin = adminSupabase();
  const { data: order, error } = await admin.from("orders")
    .select("id,user_id,status,payment_status,currency,total_amount,stripe_checkout_session_id")
    .eq("id", orderId).maybeSingle();
  if (error) throw new Error(`Order lookup: ${error.message}`);
  if (!order) throw new Error("Order not found");
  if (order.status === "paid" && order.payment_status === "paid") return "already_paid";
  if (order.status === "cancelled" && order.payment_status === "expired") return "already_expired";
  if (order.status !== "pending" || order.payment_status !== "checkout_open" || !order.stripe_checkout_session_id)
    return "not_eligible";

  const session = await stripe().checkout.sessions.retrieve(order.stripe_checkout_session_id);
  if (session.livemode || session.mode !== "payment" ||
      session.id !== order.stripe_checkout_session_id ||
      session.client_reference_id !== order.id ||
      session.metadata?.order_id !== order.id ||
      session.metadata?.user_id !== order.user_id) throw new Error("Session ownership mismatch");
  const expectedCents = Math.round(Number(order.total_amount) * 100);
  if (!Number.isSafeInteger(expectedCents) || session.amount_total !== expectedCents ||
      session.currency !== "usd" || order.currency !== "USD") throw new Error("Session amount/currency mismatch");

  let eventType: "checkout.session.completed" | "checkout.session.expired";
  if (session.status === "complete" && session.payment_status === "paid") eventType = "checkout.session.completed";
  else if (session.status === "expired" && session.payment_status !== "paid") eventType = "checkout.session.expired";
  else return "waiting";

  const intent = typeof session.payment_intent === "string"
    ? session.payment_intent : session.payment_intent?.id ?? null;
  if (eventType === "checkout.session.completed" && !intent) throw new Error("Missing payment intent");
  // Stable identifier for this distinct reconciliation path; real evt_ IDs remain for webhooks.
  const { data, error: rpcError } = await admin.rpc("finalize_stripe_checkout", {
    p_event_id: `reconcile:${eventType}:${session.id}`,
    p_event_type: eventType,
    p_session_id: session.id,
    p_payment_intent_id: intent,
    p_amount_total: session.amount_total,
    p_currency: session.currency,
  });
  if (rpcError) throw new Error(`Finalize checkout: ${rpcError.message}`);
  return String(data);
}
