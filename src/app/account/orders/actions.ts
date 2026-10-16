
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelDemoOrder(orderId: string) {
  const supabase = await createClient();

  const { data: auth, error: authError } =
    await supabase.auth.getUser();

  if (authError || !auth.user) {
    return {
      success: false,
      error: "Please sign in again.",
    };
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(orderId)) {
    return {
      success: false,
      error: "Invalid order ID.",
    };
  }

  const { data: cancelled, error } = await supabase.rpc(
    "cancel_demo_order",
    { p_order_id: orderId }
  );

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (cancelled === false) {
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${orderId}`);

    return {
      success: true,
      alreadyCancelled: true,
    };
  }

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/products");

  return {
    success: true,
    alreadyCancelled: false,
  };
}
