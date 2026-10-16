
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveShippingAddress(formData: FormData) {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/login");
  }

  const get = (key: string) =>
    String(formData.get(key) ?? "").trim();

  const fullName = get("full_name");
  const phone = get("phone");
  const line1 = get("line1");
  const line2 = get("line2");
  const city = get("city");
  const state = get("state");
  const postalCode = get("postal_code");
  const countryCode = get("country_code");

  // Validate on the server, not only with HTML attributes.
  const valid =
    fullName.length >= 2 &&
    fullName.length <= 120 &&
    phone.length >= 7 &&
    phone.length <= 30 &&
    line1.length >= 3 &&
    line1.length <= 200 &&
    line2.length <= 200 &&
    city.length >= 2 &&
    city.length <= 100 &&
    state.length >= 2 &&
    state.length <= 100 &&
    postalCode.length >= 2 &&
    postalCode.length <= 20 &&
    /^[A-Z]{2}$/.test(countryCode);

  if (!valid) {
    redirect("/checkout?error=validation");
  }

  // Store basic customer profile.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: authData.user.id,
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("Profile error:", profileError.message);
    redirect("/checkout?error=save");
  }

  // Create a shipping address owned by this user.
  const { error: addressError } = await supabase
    .from("addresses")
    .insert({
      user_id: authData.user.id,
      full_name: fullName,
      phone,
      line1,
      line2: line2 || null,
      city,
      state,
      postal_code: postalCode,
      country_code: countryCode,
      is_default: false,
    });

  if (addressError) {
    console.error("Address error:", addressError.message);
    redirect("/checkout?error=save");
  }

  revalidatePath("/checkout");
  redirect("/checkout?success=1");
}
