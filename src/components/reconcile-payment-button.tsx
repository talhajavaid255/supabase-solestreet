
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReconcilePaymentButton({
  orderId,
}: {
  orderId: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function reconcilePayment() {
    if (loading) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/stripe/reconcile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.error ||
            "Unable to verify payment."
        );
        return;
      }

      setMessage("Payment verified successfully.");
      router.refresh();

    } catch {
      setError(
        "Something went wrong while verifying payment."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={reconcilePayment}
        disabled={loading}
        className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading
          ? "Verifying payment..."
          : "Verify Payment with Stripe"}
      </button>

      {message && (
        <p
          role="status"
          className="mt-3 text-sm text-green-700"
        >
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
