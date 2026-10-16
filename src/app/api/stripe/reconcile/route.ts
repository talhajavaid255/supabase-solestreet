import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reconcileSession } from "@/lib/stripe/reconcile-session";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const base = process.env.APP_URL;
  if (!base || req.headers.get("origin") !== new URL(base).origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const orderId = (body as { orderId?: unknown })?.orderId;
  if (typeof orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(orderId))
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  const { data: owned, error } = await supabase.from("orders").select("id")
    .eq("id", orderId).eq("user_id", user.id).maybeSingle();
  if (error || !owned) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  try { return NextResponse.json({ success: true, status: await reconcileSession(orderId) }); }
  catch (e) { console.error("Reconciliation failed", orderId, e); return NextResponse.json({ error: "Verification unavailable" }, { status: 503 }); }
}
