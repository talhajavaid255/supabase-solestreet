
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CheckoutResult = {
  success: boolean;
  orderId?: string;
  error?: string;
};

export async function placeDemoOrder(
  addressId: string,
  shippingMethod: string
): Promise<CheckoutResult> {
  const supabase = await createClient();

  const { data: auth, error: authError } =
    await supabase.auth.getUser();

  if (authError || !auth.user) {
    return {
      success: false,
      error: "Please sign in before placing an order.",
    };
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(addressId)) {
    return { success: false, error: "Select a valid address." };
  }

  if (!["standard", "express"].includes(shippingMethod)) {
    return { success: false, error: "Invalid delivery method." };
  }

  const { data: orderId, error } = await supabase.rpc(
    "place_demo_order",
    {
      p_address_id: addressId,
      p_shipping_method: shippingMethod,
    }
  );

  if (error || !orderId) {
    return {
      success: false,
      error: error?.message || "Unable to place order.",
    };
  }

  // Return the ID; the client will navigate to confirmation.
  return { success: true, orderId: String(orderId) };
}
