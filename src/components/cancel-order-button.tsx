
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { cancelDemoOrder } from "@/app/account/orders/actions";

export default function CancelOrderButton({
  orderId,
}: {
  orderId: string;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const result = await cancelDemoOrder(orderId);

      if (!result.success) {
        setError(result.error || "Cancellation failed.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Unable to cancel your order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-red-200 px-6 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
      >
        <TriangleAlert className="h-4 w-4" aria-hidden />
        Cancel Demo Order
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
          role="presentation"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            aria-describedby="cancel-description"
            className="w-full max-w-md rounded-3xl bg-white p-8 text-zinc-900 shadow-2xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
              <TriangleAlert className="h-7 w-7" aria-hidden />
            </div>

            <h2
              id="cancel-title"
              className="mt-6 text-2xl font-black"
            >
              Cancel this order?
            </h2>

            <p
              id="cancel-description"
              className="mt-3 leading-7 text-zinc-600"
            >
              Your demo order will be marked as cancelled,
              and its purchased inventory will be restored.
              This action cannot be undone.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-zinc-300 px-5 py-3 font-bold disabled:opacity-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={handleCancel}
                className="flex-1 rounded-full bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

