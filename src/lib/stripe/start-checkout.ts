import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/stripe/admin";
import { stripe } from "@/lib/stripe/server";
import type Stripe from "stripe";
const cents = (value: number | string) => {
  const x = Number(value) * 100;
  if (
    !Number.isSafeInteger(Math.round(x)) ||
    Math.abs(x - Math.round(x)) > 0.00001
  )
    throw new Error("Invalid money amount");
  return Math.round(x);
};

// Reused by new checkout and old My Orders -> Pay page.
// A pending order must already exist and have inventory reserved.
export async function startStripeCheckout(
  orderId: string,
  userId: string,
  email: string | undefined,
) {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id,user_id,status,payment_status,stripe_checkout_session_id,currency,total_amount,shipping_amount,tax_amount,order_items(product_name,sku,quantity,unit_price)",
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();
  if (
    error ||
    !order ||
    order.status !== "pending" ||
    order.payment_status !== "unpaid" ||
    order.stripe_checkout_session_id
  )
    throw new Error("Order is not eligible for payment");
  if (order.currency !== "USD" || !order.order_items.length)
    throw new Error("Invalid order");
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
    order.order_items.map((i) => ({
      price_data: {
        currency: "usd",
        unit_amount: cents(i.unit_price),
        product_data: { name: i.product_name, description: `SKU: ${i.sku}` },
      },
      quantity: i.quantity,
    }));
  if (Number(order.shipping_amount) > 0)
    line_items.push({
      price_data: {
        currency: "usd",
        unit_amount: cents(order.shipping_amount),
        product_data: { name: "Shipping", description: "Selected shipping" },
      },
      quantity: 1,
    });
  if (Number(order.tax_amount) > 0)
    line_items.push({
      price_data: {
        currency: "usd",
        unit_amount: cents(order.tax_amount),
        product_data: { name: "Tax", description: "Order tax" },
      },
      quantity: 1,
    });
  const amount = line_items.reduce(
    //@ts-ignore
    (sum, i) => sum + i.price_data.unit_amount * i.quantity,
    0,
  );
  if (amount !== cents(order.total_amount) || amount < 50)
    throw new Error("Order total mismatch or too small");
  const origin = process.env.APP_URL;
  if (!origin || new URL(origin).origin !== origin)
    throw new Error("Invalid APP_URL");
  const admin = adminSupabase();
  const { data: claim, error: claimError } = await admin
    .from("orders")
    .update({
      payment_status: "initializing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .eq("payment_status", "unpaid")
    .is("stripe_checkout_session_id", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error("STRIPE ORDER CLAIM DATABASE ERROR:", {
      code: claimError.code,
      message: claimError.message,
      details: claimError.details,
      hint: claimError.hint,
    });

    throw new Error(`Could not initialize payment: ${claimError.message}`);
  }

  if (!claim) {
    console.error("STRIPE ORDER CLAIM MATCHED ZERO ROWS:", {
      orderId,
      userId,
    });

    throw new Error(
      "Payment initialization could not claim this order. Check its current database status.",
    );
  }

  let sessionId: string | undefined;
  try {
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: orderId,
        customer_email: email,
        line_items,
        metadata: {
          order_id: orderId,
          user_id: userId,
        },
        success_url: `${origin}/checkout/payment-result?order_id=${orderId}`,
        cancel_url: `${origin}/account/orders/${orderId}?checkout=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      },
      {
        idempotencyKey: `solestreet-checkout-v2-${orderId}`,
      },
    );

    sessionId = session.id;
    if (!session.url) throw new Error("Stripe did not return URL");
    const { data: bound, error: bindError } = await admin
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_session_expires_at: new Date(
          session.expires_at * 1000,
        ).toISOString(),
        payment_status: "checkout_open",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("payment_status", "initializing")
      .select("id")
      .single();
    if (bindError || !bound)
      throw new Error("Could not persist Stripe Session");
    return session.url;
  } catch (e) {
    console.error("STRIPE CHECKOUT FAILURE:", {
      orderId,
      message: e instanceof Error ? e.message : String(e),
      error: e,
    });
    if (sessionId) {
      try {
        await stripe().checkout.sessions.expire(sessionId);
      } catch (expireError) {
        console.error("RECONCILIATION NEEDED", orderId, sessionId, expireError);
      }
    }
    // Caution: a network timeout may mean Stripe created a session even if no ID returned.
    // Preserve the order + inventory; never auto-restock on an uncertain outcome.
    await admin
      .from("orders")
      .update({ payment_status: "unpaid" })
      .eq("id", orderId)
      .eq("payment_status", "initializing")
      .is("stripe_checkout_session_id", null);
    throw e;
  }
}
