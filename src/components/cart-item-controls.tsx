
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  updateCartQuantity,
  removeCartItem,
} from "@/app/cart/actions";

type Props = {
  itemId: string;
  quantity: number;
  maxStock: number;
};

export default function CartItemControls({
  itemId,
  quantity,
  maxStock,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update(next: number) {
    if (busy || next < 1 || next > Math.min(maxStock, 99)) return;

    setBusy(true);
    setError("");

    try {
      const result = await updateCartQuantity(itemId, next);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Update failed.");
      }
    } catch {
      setError("Unable to update cart.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const result = await removeCartItem(itemId);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Remove failed.");
      }
    } catch {
      setError("Unable to remove item.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex items-center overflow-hidden rounded-xl border border-zinc-200">
          <button
            onClick={() => update(quantity - 1)}
            disabled={busy || quantity <= 1}
            aria-label="Decrease quantity"
            className="qty-btn px-4 py-2 disabled:opacity-30"
          >
            −
          </button>

          <span className="min-w-8 text-center font-semibold">
            {quantity}
          </span>

          <button
            onClick={() => update(quantity + 1)}
            disabled={busy || quantity >= maxStock || quantity >= 99}
            aria-label="Increase quantity"
            className="qty-btn px-4 py-2 disabled:opacity-30"
          >
            +
          </button>
        </div>

        <button
          onClick={remove}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Remove
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
