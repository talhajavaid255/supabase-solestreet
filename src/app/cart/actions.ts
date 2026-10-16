
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Please sign in to continue.");
  }

  return { supabase, user: data.user };
}

export async function addToCart(
  variantId: string,
  quantity: number
) {
  try {
    const { supabase } = await authenticatedClient();

    if (
      !variantId ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      return { success: false, error: "Invalid selection." };
    }

    const { error } = await supabase.rpc("add_cart_item", {
      p_variant_id: variantId,
      p_quantity: quantity,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/cart");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export async function updateCartQuantity(
  itemId: string,
  quantity: number
) {
  try {
    const { supabase, user } = await authenticatedClient();

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      return { success: false, error: "Invalid quantity." };
    }

    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!cart) {
      return { success: false, error: "Cart not found." };
    }

    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", itemId)
      .eq("cart_id", cart.id)
      .select("id")
      .single();

    if (error || !data) {
      return {
        success: false,
        error: error?.message || "Unable to update item.",
      };
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export async function removeCartItem(itemId: string) {
  try {
    const { supabase, user } = await authenticatedClient();

    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!cart) {
      return { success: false, error: "Cart not found." };
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("cart_id", cart.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}
