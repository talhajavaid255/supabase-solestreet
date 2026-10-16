import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/stripe/admin";
import { reconcileSession } from "@/lib/stripe/reconcile-session";
export const runtime = "nodejs";

/** Invoke only via a trusted external scheduler; no public unauthenticated execution. */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = adminSupabase();
  const { data: orders, error } = await admin.from("orders")
    .select("id").eq("status", "pending").eq("payment_status", "checkout_open")
    .not("stripe_checkout_session_id", "is", null)
    .order("created_at", { ascending: true }).limit(20);
  if (error) return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  const results = [];
  for (const order of orders ?? []) {
    try { results.push({ orderId: order.id, result: await reconcileSession(order.id) }); }
    catch (e) { console.error("Cron reconciliation", order.id, e); results.push({ orderId: order.id, result: "error" }); }
  }
  return NextResponse.json({ checked: results.length, results });
}
