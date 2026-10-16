"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Status = { status: string; payment_status: string };
export default function PaymentResultStatus({ orderId, initial }: { orderId: string; initial: Status }) {
  const [status, setStatus] = useState(initial);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (status.status === "paid" || status.status === "cancelled") return;
    let active = true;
    let count = 0;
    const poll = async () => {
      if (!active || count++ >= 12) return;
      try {
        const r = await fetch(`/api/stripe/status?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json() as Status;
        if (active) setStatus(data);
      } catch { /* network may be temporarily unavailable */ }
    };
    void poll();
    const interval = setInterval(() => void poll(), 5000);
    return () => { active = false; clearInterval(interval); };
  }, [orderId, status.status]);
  const paid = status.status === "paid" && status.payment_status === "paid";
  const cancelled = status.status === "cancelled";
  async function verify() {
    setChecking(true); setMessage("");
    try {
      const r = await fetch("/api/stripe/reconcile", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId })
      });
      if (!r.ok) { setMessage("Verification unavailable. Try again later."); return; }
      const statusResponse = await fetch(`/api/stripe/status?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
      if (statusResponse.ok) setStatus(await statusResponse.json());
    } catch { setMessage("Network error while verifying payment."); }
    finally { setChecking(false); }
  }
  return (
    <main className="min-h-screen bg-[#faf9f6] px-6 py-20 text-zinc-900">
      <section className="mx-auto max-w-2xl rounded-3xl border border-zinc-200 bg-white p-9 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-600">SOLESTREET CHECKOUT</p>
        <h1 className="mt-4 text-3xl font-black">{paid ? "Payment successful" : cancelled ? "Checkout expired" : "Payment being verified"}</h1>
        <p className="mt-4 leading-7 text-zinc-600">
          {paid ? "Stripe has confirmed your test payment, and SoleStreet recorded it." :
           cancelled ? "The Checkout Session expired. Reserved inventory has been released." :
           "Waiting for verified payment status. A browser redirect alone does not confirm payment."}
        </p>
        <p className="mt-6 text-sm">Order: <strong>{orderId.slice(0, 8).toUpperCase()}</strong></p>
        <p className="mt-2 text-sm">Current status: {status.status} / {status.payment_status}</p>
        {!paid && !cancelled && <button type="button" onClick={verify} disabled={checking}
          className="mt-7 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-50">
          {checking ? "Verifying..." : "Verify with Stripe now"}
        </button>}
        {message && <p role="status" className="mt-3 text-sm text-red-700">{message}</p>}
        <Link className="mt-7 block font-semibold text-orange-600" href={`/account/orders/${orderId}`}>View order →</Link>
      </section>
    </main>
  );
}
