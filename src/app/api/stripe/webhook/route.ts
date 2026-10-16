import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { adminSupabase } from "@/lib/stripe/admin";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new NextResponse("Signature configuration missing", { status: 400 });
  let event: Stripe.Event;
  try { event = stripe().webhooks.constructEvent(await request.text(), signature, secret); }
  catch { return new NextResponse("Invalid Stripe signature", { status: 400 }); }
  if (event.livemode) return new NextResponse("Live event rejected", { status: 400 });
  if (!["checkout.session.completed", "checkout.session.expired"].includes(event.type))
    return NextResponse.json({ received: true, ignored: true });

  const snapshot = event.data.object as Stripe.Checkout.Session;
  if (!snapshot.id?.startsWith("cs_test_")) return new NextResponse("Invalid session", { status: 400 });
  try {
    // Retrieve current Stripe state, rather than trusting event snapshot alone.
    const session = await stripe().checkout.sessions.retrieve(snapshot.id);
    if (session.livemode || session.mode !== "payment") return new NextResponse("Wrong session mode", { status: 400 });
    if (event.type === "checkout.session.completed" &&
      (session.status !== "complete" || session.payment_status !== "paid"))
      return new NextResponse("Payment not settled", { status: 503 });
    if (event.type === "checkout.session.expired" && session.status !== "expired")
      return new NextResponse("Session not expired", { status: 503 });

    const admin = adminSupabase();
    const { data: order, error: lookupError } = await admin.from("orders")
      .select("id,user_id")
      .eq("stripe_checkout_session_id", session.id).maybeSingle();
    if (lookupError) throw new Error(`Order lookup: ${lookupError.message}`);
    if (!order) {
      // A synthetic CLI fixture has no SoleStreet order. Log it, but keep 503 for
      // unknown events because real sessions may race persistence after creation.
      console.warn("Stripe event for unregistered session", event.id, session.id);
      return new NextResponse("Session not registered; retry", { status: 503 });
    }
    if (session.client_reference_id !== order.id ||
        session.metadata?.order_id !== order.id ||
        session.metadata?.user_id !== order.user_id)
      return new NextResponse("Order/session mismatch", { status: 409 });

    const intent = typeof session.payment_intent === "string"
      ? session.payment_intent : session.payment_intent?.id ?? null;
    if (event.type === "checkout.session.completed" && !intent)
      return new NextResponse("Missing payment intent", { status: 503 });
    const { data, error } = await admin.rpc("finalize_stripe_checkout", {
      p_event_id: event.id,
      p_event_type: event.type,
      p_session_id: session.id,
      p_payment_intent_id: intent,
      p_amount_total: session.amount_total,
      p_currency: session.currency,
    });
    if (error) throw new Error(`Payment finalization: ${error.code} ${error.message}`);
    console.info("Stripe event finalized", event.id, order.id, data);
    return NextResponse.json({ received: true, result: data });
  } catch (e) {
    console.error("Stripe webhook processing failed", event.id, e);
    return new NextResponse("Webhook processing failed; retry", { status: 500 });
  }
}
